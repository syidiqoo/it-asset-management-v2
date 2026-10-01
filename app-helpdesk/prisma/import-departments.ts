import { readFileSync } from "node:fs"
import { join } from "node:path"

import { parseCsv } from "@/lib/csv"

const POSITION_PREFIXES = [
  "admin ",
  "all ops ",
  "bc ",
  "chief ",
  "gc ",
  "manager ",
  "managing ",
  "mt ",
  "pa to ",
  "pic ",
  "principal ",
  "receiving ",
  "ticketing ",
  "it back-end",
  "it fullstack",
  "it support",
  "hr expat",
  "hr maintenance",
  "hr trainer",
  "flight following",
]

const POSITION_WORDS = [
  "director",
  "inspector",
  "analyst",
  "entry",
  "trainer",
  "instructor",
  "secretary",
  "pc mx",
  "belum ada",
  "dkm",
  "occ",
]

const PLACEHOLDERS = new Set(["Unknown", "Belum Ada Posisi"])

function isPosition(name: string): boolean {
  const value = name.trim().toLowerCase()
  if (value === "intern") return true
  if (POSITION_PREFIXES.some((prefix) => value.startsWith(prefix))) return true
  return POSITION_WORDS.some((word) => value.includes(word))
}

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

  const rows = parseCsv(
    readFileSync(
      join(process.cwd(), "sample-import", "department-2026-09-18.csv"),
      "utf8"
    )
  )
  const header = (rows[0] ?? []).map((cell) => cell.trim().toLowerCase())
  const nameIdx = header.indexOf("nama")
  const parentIdx = header.indexOf("induk")
  if (nameIdx === -1 || parentIdx === -1) {
    throw new Error('Columns "Nama" and "Induk" are required.')
  }

  const deptRows: { name: string; parent: string }[] = []
  const posRows: { name: string; dept: string }[] = []
  const skipped: string[] = []

  for (const row of rows.slice(1)) {
    const name = (row[nameIdx] ?? "").trim()
    const parent = (row[parentIdx] ?? "").trim()
    if (!name) continue
    if (PLACEHOLDERS.has(name)) {
      skipped.push(name)
      continue
    }
    if (isPosition(name)) posRows.push({ name, dept: parent })
    else deptRows.push({ name, parent })
  }

  const depth = (parent: string) => (parent ? parent.split(" > ").length : 0)

  await db.$transaction(
    async (tx) => {
      await tx.department.updateMany({ data: { parentId: null } })
      await tx.department.deleteMany()
      await tx.position.deleteMany()

      deptRows.sort((a, b) => depth(a.parent) - depth(b.parent))
      const pathToId = new Map<string, number>()
      for (const item of deptRows) {
        const fullPath = item.parent ? `${item.parent} > ${item.name}` : item.name
        const parentId = item.parent ? (pathToId.get(item.parent) ?? null) : null
        const created = await tx.department.create({
          data: { name: item.name, parentId },
        })
        pathToId.set(fullPath, created.id)
      }

      if (posRows.length > 0) {
        await tx.position.createMany({
          data: posRows.map((item) => ({
            name: item.name,
            departmentId: item.dept ? (pathToId.get(item.dept) ?? null) : null,
          })),
        })
      }
    },
    { timeout: 120_000, maxWait: 15_000 }
  )

  console.log(`Departments: ${deptRows.length} created`)
  console.log(`Positions: ${posRows.length} created`)
  if (skipped.length > 0) {
    console.log(`Skipped placeholders: ${skipped.join(", ")}`)
  }
  console.log("Position names:")
  for (const item of posRows) {
    console.log(`  - ${item.name}${item.dept ? `  (dept: ${item.dept})` : ""}`)
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
