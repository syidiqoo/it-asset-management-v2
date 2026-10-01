import { readFileSync } from "node:fs"
import { join } from "node:path"

const NOMINATIM = "https://nominatim.openstreetmap.org/search"
const HEAD_OFFICE = "Head Office Pangandaran"
const USER_AGENT = "helpdesk-import/1.0 (internal)"

// Names that need a more specific query so Nominatim returns the right place.
const QUERY_OVERRIDES: Record<string, string> = {
  "Base Masamba": "Masamba, Luwu Utara",
  "Unit Sabu": "Sabu Raijua",
  "Unit Simelue": "Simeulue",
  "Unit Tanjungselor": "Tanjung Selor",
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

function placeName(address: string): string {
  return address.trim().replace(/^(base|unit|head office)\s+/i, "")
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocode(
  query: string
): Promise<{ lat: number; lon: number } | null> {
  const params = new URLSearchParams({
    q: `${query}, Indonesia`,
    format: "json",
    limit: "1",
    countrycodes: "id",
  })
  try {
    const response = await fetch(`${NOMINATIM}?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT },
    })
    if (!response.ok) return null
    const data = (await response.json()) as { lat: string; lon: string }[]
    if (!Array.isArray(data) || data.length === 0) return null
    return { lat: Number(data[0].lat), lon: Number(data[0].lon) }
  } catch {
    return null
  }
}

async function main() {
  loadEnv()
  const { db } = await import("@/lib/server/db")

  const departments = await db.department.findMany({
    where: {
      OR: [
        { name: { startsWith: "Base " } },
        { name: { startsWith: "Unit " } },
      ],
    },
    orderBy: { name: "asc" },
  })
  const baseUnitNames = [...new Set(departments.map((item) => item.name.trim()))]

  const entries = [HEAD_OFFICE, ...baseUnitNames]

  console.log(`Geocoding ${entries.length} locations...`)
  const rows: {
    code: string
    name: string
    lat: number | null
    lon: number | null
  }[] = []

  for (const [index, name] of entries.entries()) {
    const coords = await geocode(QUERY_OVERRIDES[name] ?? placeName(name))
    rows.push({
      code: String(index + 1).padStart(3, "0"),
      name,
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
    })
    console.log(
      `  ${String(index + 1).padStart(3, "0")}  ${name}  ->  ${
        coords ? `${coords.lat}, ${coords.lon}` : "NOT FOUND"
      }`
    )
    await sleep(1100)
  }

  const found = rows.filter((row) => row.lat !== null).length
  console.log(`\nGeocoded ${found}/${rows.length}. Writing to database...`)

  await db.$transaction(
    async (tx) => {
      await tx.internetData.updateMany({ data: { locationId: null } })
      await tx.location.deleteMany()
      await tx.location.createMany({
        data: rows.map((row) => ({
          code: row.code,
          address: row.name,
          detailStreetAddress: row.name,
          latitude: row.lat,
          longitude: row.lon,
        })),
      })
    },
    { timeout: 120_000, maxWait: 15_000 }
  )

  console.log(`Locations: ${rows.length} written (${found} with coordinates).`)
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
