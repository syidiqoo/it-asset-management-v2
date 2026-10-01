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

async function main() {
  loadEnv()
  const { db } = await import("@/lib/server/db")

  const text = readFileSync(
    join(process.cwd(), "sample-import", "user-2026-09-18.csv"),
    "utf8"
  )
  const rows = parseCsv(text)
  const header = (rows[0] ?? []).map((cell) => cell.trim().toLowerCase())
  const nameIdx = header.indexOf("nama")
  if (nameIdx === -1) throw new Error('Column "Nama" not found.')

  const names = [
    ...new Set(
      rows
        .slice(1)
        .map((row) => (row[nameIdx] ?? "").trim())
        .filter((name) => name.length > 0)
    ),
  ].sort((a, b) => a.localeCompare(b, "id"))

  await db.$transaction(
    async (tx) => {
      await tx.employee.deleteMany()
      if (names.length > 0) {
        await tx.employee.createMany({ data: names.map((name) => ({ name })) })
      }
    },
    { timeout: 120_000, maxWait: 15_000 }
  )

  console.log(`Employees: ${names.length} imported (names only).`)
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
