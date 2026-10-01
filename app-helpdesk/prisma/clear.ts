import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// Business data only — User accounts are kept so you can still sign in.
const TABLES = [
  "AssetFileHistory",
  "Asset",
  "SimCard",
  "InternetData",
  "Employee",
  "Position",
  "Department",
  "Category",
  "SimPackage",
  "Location",
  "FileBlob",
  "Doc",
] as const

async function counts() {
  const rows: Record<string, number> = {}
  for (const table of TABLES) {
    const result = await db.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM "${table}"`
    )
    rows[table] = result[0]?.count ?? 0
  }
  return rows
}

async function main() {
  const before = await counts()
  console.log("Before:", JSON.stringify(before))

  await db.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`
  )

  const after = await counts()
  console.log("After:", JSON.stringify(after))
  console.log("Done — seed & dummy data cleared (User accounts kept).")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
