import { readFileSync } from "node:fs"
import { join } from "node:path"

import { parseCsv } from "@/lib/csv"

function loadEnv() {
  const content = readFileSync(join(process.cwd(), ".env"), "utf8")
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match) continue
    const [, key, raw] = match
    if (process.env[key] !== undefined) continue
    let value = raw.trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

// Same normalizePhone as import.ts (keep leading zero, convert 62 prefix).
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("62")) return `0${digits.slice(2)}`
  return digits.startsWith("0") ? digits : `0${digits}`
}

function headerKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

// Confirmed fuzzy matches: SIM CSV name → DB employee name
const NAME_OVERRIDES: Record<string, string> = {
  "nadine pascale kaiser": "NADINE KAISER",
  "melinasary": "MELINASARI",
  "virgiwan wiranda": "M. VIRGIAWAN WIRANDA",
  "dadan hamdani": "DADAN RAMDHANI",
  "ernanda putra rahmatullah": "ERNANDA PUTERA RAHMATHULLAH",
  "melani ayu permata sari": "MELANI AYU PERMATASARI",
  "sekar gading": "SEKAR GADING MAHADEWI",
  "tika mustika": "NOVIA MUSTIKA DEWI",
  "annisa zata": "ANNISA ZATA ISMAH",
  "dicky krisnadi": "DICKY KRISNANDI",
  "faried wibowo": "FARIED BUDI WIBOWO",
  "m julio alkindy": "M. JULIO ALKINDY",
  "rifadiyanto": "RIFADIANTO",
}

async function main() {
  loadEnv()
  const { db } = await import("@/lib/server/db")

  // --- 1. Read data-sim.csv ---
  const simText = readFileSync(
    join(process.cwd(), "sample-import", "data-sim.csv"),
    "utf8"
  )
  const simRows = parseCsv(simText)
  if (simRows.length < 2) {
    console.log("data-sim.csv: no rows.")
    return
  }

  // Parse header -> column index
  const header = simRows[0].map((c) => headerKey(c))
  const phoneIdx = header.findIndex(
    (h) =>
      h === "msisdn" ||
      h === "phone number" ||
      h === "no handphone" ||
      h === "no. handphone" ||
      h === "nomor handphone" ||
      h === "nomor"
  )
  const nameIdx = header.findIndex(
    (h) => h === "name" || h === "nama" || h === "employee" || h === "pemegang"
  )
  if (phoneIdx === -1) throw new Error('Column MSISDN/Phone not found in data-sim.csv.')
  if (nameIdx === -1) throw new Error('Column Nama/Employee not found in data-sim.csv.')

  // --- 2. Read employee CSV ---
  let employeeNames: string[] = []
  try {
    const empText = readFileSync(
      join(process.cwd(), "sample-import", "user-2026-09-18.csv"),
      "utf8"
    )
    const empRows = parseCsv(empText)
    const empHeader = (empRows[0] ?? []).map((c) => headerKey(c))
    const empNameIdx = empHeader.indexOf("nama")
    if (empNameIdx !== -1) {
      employeeNames = [
        ...new Set(
          empRows
            .slice(1)
            .map((row) => (row[empNameIdx] ?? "").trim())
            .filter((name) => name.length > 0)
        ),
      ]
    }
  } catch {
    console.log("user-2026-09-18.csv not found. Employees from DB will be used.")
  }

  // --- 3. Load employees from DB ---
  const dbEmployees = await db.employee.findMany({
    select: { id: true, name: true, departmentId: true },
  })
  const employeeByName = new Map<
    string,
    { id: number; departmentId: number | null }
  >()
  for (const emp of dbEmployees) {
    const key = headerKey(emp.name)
    if (key && !employeeByName.has(key))
      employeeByName.set(key, { id: emp.id, departmentId: emp.departmentId })
  }

  // If employee CSV has names, filter to only those.
  const validNames =
    employeeNames.length > 0
      ? new Set(employeeNames.map((n) => headerKey(n)))
      : null

  // --- 4. Load all SIM cards from DB ---
  const allSims = await db.simCard.findMany({
    select: { id: true, phoneNumber: true, employeeId: true },
  })
  const simByPhone = new Map<string, { id: number; employeeId: number | null }>()
  for (const sim of allSims) {
    simByPhone.set(sim.phoneNumber.toLowerCase(), sim)
  }

  // --- 5. Match & batch assign ---
  const toUpdate: { id: number; employeeId: number; departmentId: number | null }[] = []
  let noSim = 0
  let noEmp = 0
  let alreadyAssigned = 0
  let assigned = 0

  const dataRows = simRows.slice(1)
  for (const row of dataRows) {
    const phoneRaw = normalizePhone(row[phoneIdx] ?? "")
    if (!phoneRaw) continue

    const employeeName = (row[nameIdx] ?? "").trim()
    if (!employeeName) continue // available SIM card, skip

    const empKey = headerKey(employeeName)
    const resolvedKey = NAME_OVERRIDES[empKey]
      ? headerKey(NAME_OVERRIDES[empKey])
      : empKey

    // Filter by employee CSV (skip for fuzzy overrides since they won't match exactly)
    if (!NAME_OVERRIDES[empKey] && validNames && !validNames.has(empKey)) continue

    const emp = employeeByName.get(resolvedKey)
    if (!emp) {
      noEmp += 1
      continue
    }

    const sim = simByPhone.get(phoneRaw.toLowerCase())
    if (!sim) {
      noSim += 1
      continue
    }
    if (sim.employeeId !== null) {
      alreadyAssigned += 1
      continue
    }

    toUpdate.push({ id: sim.id, employeeId: emp.id, departmentId: emp.departmentId })
    assigned += 1
  }

  // Execute batch update
  if (toUpdate.length > 0) {
    for (const item of toUpdate) {
      await db.simCard.update({
        where: { id: item.id },
        data: { employeeId: item.employeeId, departmentId: item.departmentId },
      })
    }
  }

  console.log(`SIM cards assigned to employees: ${assigned}`)
  if (noSim > 0) console.log(`  SIM not found in DB: ${noSim}`)
  if (noEmp > 0) console.log(`  Employee name not found: ${noEmp}`)
  if (alreadyAssigned > 0)
    console.log(`  Already assigned, skipped: ${alreadyAssigned}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    const { db } = await import("@/lib/server/db")
    await db.$disconnect()
  })
