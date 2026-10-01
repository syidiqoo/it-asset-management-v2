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
  const { applySimCardImport } = await import("@/lib/server/import")

  const rows = parseCsv(
    readFileSync(join(process.cwd(), "sample-import", "data-sim.csv"), "utf8")
  )

  const result = await db.$transaction(
    async (tx) => {
      await tx.simCard.deleteMany()
      const imported = await applySimCardImport(tx, rows)
      // Employee, department, and package are intentionally left empty.
      await tx.simCard.updateMany({
        data: { employeeId: null, departmentId: null, packageId: null },
      })
      return imported
    },
    { timeout: 120_000, maxWait: 15_000 }
  )

  console.log(`SIM cards: ${result.imported} imported`)
  console.log(`  skipped (no MSISDN): ${result.skippedNoPhone}`)
  console.log(`  skipped (duplicate): ${result.skippedDuplicate}`)
  console.log("  employee/department/package: left empty")
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
