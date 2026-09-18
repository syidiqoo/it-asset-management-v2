import { readFileSync } from "node:fs"
import { join } from "node:path"

import { parseCsv } from "@/lib/csv"

const CATEGORIES = ["Laptop", "Phone", "PC", "Printer"]
const UPDATED_BY = "IT Administrator"
const FILES = {
  department: "department-2026-09-18.csv",
  employee: "user-2026-09-18.csv",
  asset: "aset-2026-09-18.csv",
} as const

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

function readRows(name: string): string[][] {
  const text = readFileSync(
    join(process.cwd(), "sample-import", name),
    "utf8"
  )
  return parseCsv(text)
}

async function main() {
  loadEnv()
  const { db } = await import("@/lib/server/db")
  const { applyAssetImport, applyDepartmentImport, applyEmployeeImport } =
    await import("@/lib/server/import")

  const departmentRows = readRows(FILES.department)
  const employeeRows = readRows(FILES.employee)
  const assetRows = readRows(FILES.asset)

  const result = await db.$transaction(
    async (tx) => {
      await tx.simCard.deleteMany()
      await tx.asset.deleteMany()
      await tx.employee.deleteMany()
      await tx.department.updateMany({ data: { parentId: null } })
      await tx.department.deleteMany()

      for (const name of CATEGORIES) {
        await tx.category.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      }

      const departments = await applyDepartmentImport(tx, departmentRows)
      const employees = await applyEmployeeImport(tx, employeeRows)
      const assets = await applyAssetImport(tx, assetRows, UPDATED_BY)
      return { departments, employees, assets }
    },
    { timeout: 300_000, maxWait: 15_000 }
  )

  console.log(
    `Departments: ${result.departments.created} created, ${result.departments.skipped} skipped`
  )
  console.log(
    `Employees: ${result.employees.created} created, ${result.employees.skipped} skipped`
  )
  console.log(`Assets: ${result.assets.imported} imported`)
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
