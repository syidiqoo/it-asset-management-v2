import { readFileSync } from "node:fs"
import { join } from "node:path"

import { parseCsv } from "@/lib/csv"

const FILES = {
  internet: "data-internet.csv",
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
  const { applyInternetImport } = await import("@/lib/server/import")

  const internetRows = readRows(FILES.internet)

  const result = await db.$transaction(
    (tx) => applyInternetImport(tx, internetRows),
    { timeout: 300_000, maxWait: 15_000 }
  )

  console.log(
    `Internet data: ${result.imported} imported, ${result.skipped} skipped`
  )
  if (result.unknownLocations.length > 0) {
    console.log(
      `Locations left empty (${result.unknownLocations.length}): ${result.unknownLocations.join(", ")}`
    )
  }
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
