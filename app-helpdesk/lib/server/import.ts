import { Prisma } from "@prisma/client"

import { MAX_DEPARTMENT_LEVEL } from "@/lib/departments"
import { normalizeInternetId } from "@/lib/internet"
import { CONDITIONS, type Condition } from "@/lib/types"
import { db } from "@/lib/server/db"

export type ImportTx = Prisma.TransactionClient

type DeptReader = {
  department: {
    findMany(): Promise<
      { id: number; name: string; parentId: number | null }[]
    >
  }
}

export type DepartmentIndex = {
  byPath: Map<string, number>
  byName: Map<string, number>
  levelById: Map<number, number>
}

export async function departmentIndex(
  client: DeptReader = db
): Promise<DepartmentIndex> {
  const items = await client.department.findMany()
  const byId = new Map(items.map((item) => [item.id, item]))
  const byPath = new Map<string, number>()
  const byName = new Map<string, number>()
  const levelById = new Map<number, number>()

  for (const item of items) {
    const chain = [item.name.trim()]
    let parentId = item.parentId
    const seen = new Set([item.id])
    let broken = false
    while (parentId !== null) {
      if (seen.has(parentId)) {
        broken = true
        break
      }
      seen.add(parentId)
      const parent = byId.get(parentId)
      if (!parent) {
        broken = true
        break
      }
      chain.unshift(parent.name.trim())
      parentId = parent.parentId
    }
    if (broken) continue
    byPath.set(chain.join(" > ").toLowerCase(), item.id)
    const key = item.name.trim().toLowerCase()
    if (!byName.has(key)) byName.set(key, item.id)
    levelById.set(item.id, chain.length)
  }

  return { byPath, byName, levelById }
}

const MAX_ROWS = 2000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function clean(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim()
  if (!trimmed || trimmed === "-") return null
  return trimmed
}

function isEmptyRef(value: string): boolean {
  const trimmed = value.trim().toLowerCase()
  return trimmed === "" || trimmed === "unknown"
}

function dataRows(rows: string[][]): { header: string[]; items: string[][] } {
  const header = (rows[0] ?? []).map((cell) => cell.trim())
  const items = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
  if (items.length === 0) throw new Error("CSV has no data rows.")
  if (items.length > MAX_ROWS) {
    throw new Error(`Maximum ${MAX_ROWS} rows per import.`)
  }
  return { header, items }
}

function parseDay(raw: string, line: number, label: string): Date {
  const date = new Date(`${raw}T00:00:00Z`)
  if (!DATE_PATTERN.test(raw) || Number.isNaN(date.getTime())) {
    throw new Error(`Row ${line}: ${label} "${raw}" is invalid.`)
  }
  return date
}

export async function applyDepartmentImport(
  tx: ImportTx,
  rows: string[][]
): Promise<{ created: number; skipped: number }> {
  const { header, items } = dataRows(rows)
  const lowered = header.map((cell) => cell.toLowerCase())
  let nameIdx = 0
  let parentIdx = 1
  if (lowered[1] === "nama") {
    nameIdx = 1
    parentIdx = 2
  } else if (lowered[0] !== "name" || lowered[1] !== "parent") {
    throw new Error("Header must be: Name, Parent.")
  }

  const index = await departmentIndex(tx)
  const seen = new Set<string>()
  const queue: { line: number; name: string; parentPath: string }[] = []
  let skipped = 0

  items.forEach((row, rowIndex) => {
    const line = rowIndex + 2
    const name = (row[nameIdx] ?? "").trim()
    if (!name) throw new Error(`Row ${line}: name is required.`)
    const key = name.toLowerCase()
    if (seen.has(key)) {
      throw new Error(`Row ${line}: duplicate name in file.`)
    }
    seen.add(key)
    if (index.byName.has(key)) {
      skipped += 1
      return
    }
    queue.push({ line, name, parentPath: (row[parentIdx] ?? "").trim() })
  })

  let created = 0
  let pending = queue
  while (pending.length > 0) {
    let progress = false
    const next: typeof pending = []
    for (const item of pending) {
      let parentId: number | null = null
      let level = 1
      if (item.parentPath) {
        const found = index.byPath.get(item.parentPath.toLowerCase())
        if (!found) {
          next.push(item)
          continue
        }
        level = (index.levelById.get(found) ?? 1) + 1
        if (level > MAX_DEPARTMENT_LEVEL) {
          throw new Error(
            `Row ${item.line}: exceeds maximum ${MAX_DEPARTMENT_LEVEL} levels.`
          )
        }
        parentId = found
      }
      const createdRow = await tx.department.create({
        data: { name: item.name, parentId },
      })
      const fullPath = item.parentPath
        ? `${item.parentPath} > ${item.name}`
        : item.name
      index.byPath.set(fullPath.toLowerCase(), createdRow.id)
      if (!index.byName.has(item.name.toLowerCase())) {
        index.byName.set(item.name.toLowerCase(), createdRow.id)
      }
      index.levelById.set(createdRow.id, level)
      created += 1
      progress = true
    }
    if (!progress) {
      const stuck = next
        .slice(0, 5)
        .map(
          (item) => `Row ${item.line} ("${item.name}" → "${item.parentPath}")`
        )
        .join("; ")
      throw new Error(`Parent not found: ${stuck}.`)
    }
    pending = next
  }

  return { created, skipped }
}

export async function applyEmployeeImport(
  tx: ImportTx,
  rows: string[][]
): Promise<{ created: number; skipped: number }> {
  const { header, items } = dataRows(rows)
  const lowered = header.map((cell) => cell.toLowerCase())
  let nameIdx = 0
  let deptIdx = 1
  if (lowered[1] === "nama") {
    nameIdx = 1
    deptIdx = 4
  } else if (lowered[0] !== "name" || lowered[1] !== "department") {
    throw new Error("Header must be: Name, Department.")
  }

  const index = await departmentIndex(tx)
  const existing = new Set(
    (await tx.employee.findMany()).map((item) =>
      item.name.trim().toLowerCase()
    )
  )
  const seen = new Set<string>()
  const pending: { name: string; departmentId: number | null }[] = []
  let skipped = 0

  items.forEach((row, rowIndex) => {
    const line = rowIndex + 2
    const name = (row[nameIdx] ?? "").trim()
    if (!name) throw new Error(`Row ${line}: name is required.`)
    const key = name.toLowerCase()
    if (seen.has(key)) {
      throw new Error(`Row ${line}: duplicate name in file.`)
    }
    seen.add(key)
    if (existing.has(key)) {
      skipped += 1
      return
    }
    const deptRaw = (row[deptIdx] ?? "").trim()
    let departmentId: number | null = null
    if (!isEmptyRef(deptRaw)) {
      const found = index.byPath.get(deptRaw.toLowerCase())
      if (!found) {
        throw new Error(
          `Row ${line}: department "${deptRaw}" not found. Import departments first.`
        )
      }
      departmentId = found
    }
    pending.push({ name, departmentId })
  })

  if (pending.length > 0) {
    await tx.employee.createMany({ data: pending })
  }
  return { created: pending.length, skipped }
}

export async function applyAssetImport(
  tx: ImportTx,
  rows: string[][],
  updatedBy: string
): Promise<{ imported: number; skipped: number }> {
  const { header, items } = dataRows(rows)
  const lowered = header.map((cell) => cell.toLowerCase())
  const sample = lowered[1] === "kategori inventaris"
  const idx = sample
    ? {
        category: 1,
        name: 2,
        code: 3,
        serial: 4,
        employee: 5,
        department: 7,
        condition: 8,
        record: 9,
        purchase: 10,
        note: 12,
      }
    : (() => {
        const expected = [
          "category",
          "asset name",
          "code",
          "serial number",
          "employee",
          "department",
          "condition",
          "purchase date",
          "note",
        ]
        const matches =
          lowered.length === expected.length &&
          expected.every((column, columnIndex) => lowered[columnIndex] === column)
        if (!matches) {
          throw new Error(
            "Header must be: Category, Asset Name, Code, Serial Number, Employee, Department, Condition, Purchase Date, Note."
          )
        }
        return {
          category: 0,
          name: 1,
          code: 2,
          serial: 3,
          employee: 4,
          department: 5,
          condition: 6,
          record: -1,
          purchase: 7,
          note: 8,
        }
      })()

  const categoryByName = new Map(
    (await tx.category.findMany()).map((item) => [
      item.name.trim().toLowerCase(),
      item.id,
    ])
  )
  const employeeByName = new Map<string, number>()
  for (const item of await tx.employee.findMany()) {
    const key = item.name.trim().toLowerCase()
    if (!employeeByName.has(key)) employeeByName.set(key, item.id)
  }
  const existingCodes = new Set(
    (await tx.asset.findMany({ select: { code: true } })).map((item) =>
      item.code.trim().toLowerCase()
    )
  )
  const index = await departmentIndex(tx)

  const seenCodes = new Set<string>()
  let skipped = 0
  const pending: {
    categoryId: number
    name: string
    code: string
    serialNumber: string | null
    employeeId: number | null
    departmentId: number | null
    condition: Condition
    recordDate: Date
    purchaseDate: Date | null
    note: string | null
  }[] = []

  items.forEach((row, rowIndex) => {
    const line = rowIndex + 2
    const categoryId = categoryByName.get(
      (row[idx.category] ?? "").trim().toLowerCase()
    )
    if (!categoryId) {
      throw new Error(
        `Row ${line}: category "${(row[idx.category] ?? "").trim()}" not found.`
      )
    }
    const name = (row[idx.name] ?? "").trim()
    if (!name) throw new Error(`Row ${line}: asset name is required.`)
    const code = (row[idx.code] ?? "").trim()
    if (!code) throw new Error(`Row ${line}: code is required.`)
    const codeKey = code.toLowerCase()
    if (seenCodes.has(codeKey)) {
      throw new Error(`Row ${line}: duplicate code "${code}" in file.`)
    }
    seenCodes.add(codeKey)
    if (existingCodes.has(codeKey)) {
      skipped += 1
      return
    }

    let employeeId: number | null = null
    const employeeRaw = (row[idx.employee] ?? "").trim()
    if (!isEmptyRef(employeeRaw)) {
      const found = employeeByName.get(employeeRaw.toLowerCase())
      if (!found) {
        throw new Error(
          `Row ${line}: employee "${employeeRaw}" not found. Import employees first.`
        )
      }
      employeeId = found
    }

    let departmentId: number | null = null
    const departmentRaw = (row[idx.department] ?? "").trim()
    if (!isEmptyRef(departmentRaw)) {
      const found = index.byPath.get(departmentRaw.toLowerCase())
      if (!found) {
        throw new Error(
          `Row ${line}: department "${departmentRaw}" not found. Import departments first.`
        )
      }
      departmentId = found
    }

    const conditionRaw = (row[idx.condition] ?? "").trim()
    if (!(CONDITIONS as string[]).includes(conditionRaw)) {
      throw new Error(
        `Row ${line}: condition must be ${CONDITIONS.join(", ")}.`
      )
    }

    let recordDate = new Date()
    if (idx.record >= 0) {
      const recordRaw = (row[idx.record] ?? "").trim()
      if (recordRaw) recordDate = parseDay(recordRaw, line, "date")
    }

    let purchaseDate: Date | null = null
    const purchaseRaw = (row[idx.purchase] ?? "").trim()
    if (purchaseRaw) {
      purchaseDate = parseDay(purchaseRaw, line, "purchase date")
    }

    pending.push({
      categoryId,
      name,
      code,
      serialNumber: clean(row[idx.serial]),
      employeeId,
      departmentId,
      condition: conditionRaw as Condition,
      recordDate,
      purchaseDate,
      note: clean(row[idx.note]),
    })
  })

  if (pending.length > 0) {
    await tx.asset.createMany({
      data: pending.map((item) => ({ ...item, updatedBy })),
    })
  }
  return { imported: pending.length, skipped }
}

// Column names accepted from the internet CSV. The source spreadsheet labels
// columns slightly differently between sheets, so each field lists aliases.
const INTERNET_COLUMNS: Record<string, string[]> = {
  location: ["location", "base"],
  detail: ["detail", "lokasi"],
  internetId: ["internet id", "no. pelanggan", "no pelanggan", "nomor internet"],
  service: ["service", "layanan"],
  bandwidth: [
    "bandwith (mbps)",
    "bandwidth (mbps)",
    "bandwith / package",
    "bandwidth / package",
    "bandwith",
    "bandwidth",
  ],
  customerName: ["customer name", "nama", "atas nama"],
  monthlyCost: ["monthly cost", "tagihan bulanan"],
  paymentMethod: ["payment method", "paymen method", "metode pembayaran"],
}

function headerKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function internetColumns(header: string[]): Record<string, number> | null {
  const index: Record<string, number> = {}

  header.forEach((cell, column) => {
    const key = headerKey(cell)
    for (const [field, aliases] of Object.entries(INTERNET_COLUMNS)) {
      if (index[field] === undefined && aliases.includes(key)) {
        index[field] = column
      }
    }
  })

  if (index.location === undefined || index.internetId === undefined) return null
  return index
}

function locationKey(value: string): string {
  return headerKey(value).replace(/^(base|unit|head office)\s+/, "")
}

function firstNumber(value: string): string | null {
  return value.match(/\d+/)?.[0] ?? null
}

export async function applyInternetImport(
  tx: ImportTx,
  rows: string[][]
): Promise<{ imported: number; skipped: number; unknownLocations: string[] }> {
  const items = rows.filter((row) => row.some((cell) => cell.trim() !== ""))
  if (items.length === 0) throw new Error("CSV has no rows.")

  // The spreadsheet keeps a title and blank rows above the real header.
  let index: Record<string, number> | null = null
  let start = 0
  for (let i = 0; i < Math.min(items.length, 10); i += 1) {
    const parsed = internetColumns(items[i])
    if (parsed) {
      index = parsed
      start = i + 1
      break
    }
  }
  if (!index) {
    throw new Error(
      "Header not found. Required columns: Location, Internet ID, Service, Customer Name, Monthly Cost."
    )
  }

  const dataRows = items.slice(start)
  if (dataRows.length === 0) throw new Error("CSV has no data rows.")
  if (dataRows.length > MAX_ROWS) {
    throw new Error(`Maximum ${MAX_ROWS} rows per import.`)
  }

  const locations = await tx.location.findMany({
    select: { id: true, address: true },
  })
  const locationByName = new Map<string, number>()
  for (const location of locations) {
    const key = locationKey(location.address ?? "")
    if (key && !locationByName.has(key)) locationByName.set(key, location.id)
  }

  const existing = new Set(
    (await tx.internetData.findMany({ select: { internetId: true } })).map(
      (item) => item.internetId
    )
  )

  const unknown = new Set<string>()
  const seen = new Set<string>()
  let skipped = 0
  const pending: {
    internetId: string
    locationId: number | null
    detail: string | null
    service: string
    bandwidthMbps: number | null
    customerName: string
    monthlyCost: number
    paymentMethod: string | null
  }[] = []

  dataRows.forEach((row, rowIndex) => {
    const line = start + rowIndex + 2
    const cell = (field: string) =>
      index[field] === undefined ? "" : (row[index[field]] ?? "").trim()

    const rawId = cell("internetId")
    const idNumber = firstNumber(rawId)
    if (!idNumber) {
      throw new Error(`Row ${line}: Internet ID "${rawId}" is invalid.`)
    }
    const internetId = normalizeInternetId(idNumber)
    const idKey = internetId.toLowerCase()
    if (seen.has(idKey)) {
      throw new Error(`Row ${line}: duplicate Internet ID "${internetId}" in file.`)
    }
    seen.add(idKey)
    if (existing.has(internetId)) {
      skipped += 1
      return
    }

    const service = cell("service")
    if (!service) throw new Error(`Row ${line}: Service is required.`)
    const customerName = cell("customerName")
    if (!customerName) throw new Error(`Row ${line}: Customer Name is required.`)

    const locationName = cell("location")
    let locationId: number | null = null
    if (locationName) {
      locationId = locationByName.get(locationKey(locationName)) ?? null
      if (locationId === null) unknown.add(locationName)
    }

    const bandwidthNumber = firstNumber(cell("bandwidth"))
    const costDigits = cell("monthlyCost").replace(/\D/g, "")

    pending.push({
      internetId,
      locationId,
      detail: clean(cell("detail")),
      service,
      bandwidthMbps: bandwidthNumber === null ? null : Number(bandwidthNumber),
      customerName,
      monthlyCost: costDigits ? Number(costDigits) : 0,
      paymentMethod: clean(cell("paymentMethod")),
    })
  })

  if (pending.length > 0) {
    await tx.internetData.createMany({ data: pending })
  }

  return {
    imported: pending.length,
    skipped,
    unknownLocations: [...unknown],
  }
}

const SIM_CARD_COLUMNS: Record<string, string[]> = {
  phone: [
    "msisdn",
    "phone number",
    "no handphone",
    "no. handphone",
    "nomor handphone",
    "nomor",
  ],
  employee: ["name", "nama", "employee", "pemegang"],
  department: [
    "position - department",
    "position-department",
    "posisi - department",
    "department",
    "departemen",
    "position",
    "posisi",
  ],
  package: ["package", "paket", "sim package"],
  clsDomestic: ["cls domestic"],
  clsRoaming: ["cls roaming"],
  note: ["note", "notes", "catatan", "keterangan"],
}

function simCardColumns(header: string[]): Record<string, number> | null {
  const index: Record<string, number> = {}

  header.forEach((cell, column) => {
    const key = headerKey(cell)
    for (const [field, aliases] of Object.entries(SIM_CARD_COLUMNS)) {
      if (index[field] === undefined && aliases.includes(key)) {
        index[field] = column
      }
    }
  })

  return index.phone === undefined ? null : index
}

// Local Indonesian format: keep the leading zero, convert the 62 prefix.
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("62")) return `0${digits.slice(2)}`
  return digits.startsWith("0") ? digits : `0${digits}`
}

export async function applySimCardImport(
  tx: ImportTx,
  rows: string[][]
): Promise<{
  imported: number
  skipped: number
  skippedNoPhone: number
  skippedDuplicate: number
  unknownEmployees: string[]
  unknownDepartments: string[]
  unknownPackages: string[]
}> {
  const items = rows.filter((row) => row.some((cell) => cell.trim() !== ""))
  if (items.length === 0) throw new Error("CSV has no rows.")

  let index: Record<string, number> | null = null
  let start = 0
  for (let i = 0; i < Math.min(items.length, 5); i += 1) {
    const parsed = simCardColumns(items[i])
    if (parsed) {
      index = parsed
      start = i + 1
      break
    }
  }
  if (!index) {
    throw new Error(
      "Header not found. Required column: MSISDN (or Phone Number)."
    )
  }

  const dataRows = items.slice(start)
  if (dataRows.length === 0) throw new Error("CSV has no data rows.")
  if (dataRows.length > MAX_ROWS) {
    throw new Error(`Maximum ${MAX_ROWS} rows per import.`)
  }

  const employeeByName = new Map<string, number>()
  for (const employee of await tx.employee.findMany()) {
    const key = headerKey(employee.name)
    if (key && !employeeByName.has(key)) employeeByName.set(key, employee.id)
  }

  // Reuses the shared index so a value matches either the department name or
  // its full "A > B" path, the same way the employee and asset imports match.
  const departmentLookup = await departmentIndex(tx)

  const packageByName = new Map<string, number>()
  for (const item of await tx.simPackage.findMany()) {
    const key = headerKey(item.name)
    if (key && !packageByName.has(key)) packageByName.set(key, item.id)
  }

  const existing = new Set(
    (await tx.simCard.findMany({ select: { phoneNumber: true } })).map((item) =>
      item.phoneNumber.toLowerCase()
    )
  )

  const unknownEmployees = new Set<string>()
  const unknownDepartments = new Set<string>()
  const unknownPackages = new Set<string>()
  const seen = new Set<string>()
  let skipped = 0
  let skippedNoPhone = 0
  let skippedDuplicate = 0
  const pending: {
    phoneNumber: string
    employeeId: number | null
    departmentId: number | null
    packageId: number | null
    clsDomestic: string | null
    clsRoaming: string | null
    note: string | null
    terminated: boolean
  }[] = []

  dataRows.forEach((row) => {
    const cell = (field: string) =>
      index[field] === undefined ? "" : (row[index[field]] ?? "").trim()

    // The sheet has label rows (e.g. a divider) with no number; those are not
    // SIM cards, so they are counted and skipped instead of failing the import.
    const phoneNumber = normalizePhone(cell("phone"))
    if (!phoneNumber) {
      skippedNoPhone += 1
      return
    }
    // MSISDN is the unique key, so a number repeated inside one file cannot
    // become a second card; the repeat is counted and skipped.
    const phoneKey = phoneNumber.toLowerCase()
    if (seen.has(phoneKey)) {
      skippedDuplicate += 1
      return
    }
    seen.add(phoneKey)
    if (existing.has(phoneKey)) {
      skipped += 1
      return
    }

    const employeeName = cell("employee")
    let employeeId: number | null = null
    if (employeeName) {
      employeeId = employeeByName.get(headerKey(employeeName)) ?? null
      if (employeeId === null) unknownEmployees.add(employeeName)
    }

    const departmentName = cell("department")
    let departmentId: number | null = null
    if (departmentName) {
      const key = departmentName.trim().toLowerCase()
      departmentId =
        departmentLookup.byPath.get(key) ??
        departmentLookup.byName.get(key) ??
        null
      if (departmentId === null) unknownDepartments.add(departmentName)
    }

    const packageName = cell("package")
    let packageId: number | null = null
    if (packageName) {
      packageId = packageByName.get(headerKey(packageName)) ?? null
      if (packageId === null) unknownPackages.add(packageName)
    }

    pending.push({
      phoneNumber,
      employeeId,
      departmentId,
      packageId,
      clsDomestic: clean(cell("clsDomestic")),
      clsRoaming: clean(cell("clsRoaming")),
      note: clean(cell("note")),
      terminated: false,
    })
  })

  if (pending.length > 0) {
    await tx.simCard.createMany({ data: pending })
  }

  return {
    imported: pending.length,
    skipped,
    skippedNoPhone,
    skippedDuplicate,
    unknownEmployees: [...unknownEmployees],
    unknownDepartments: [...unknownDepartments],
    unknownPackages: [...unknownPackages],
  }
}
