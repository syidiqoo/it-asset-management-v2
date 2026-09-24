import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const DEMO_CODE = "DEMO-RIWAYAT-FOTO"
const DEMO_FILE_PREFIX = "demo-foto-"
const MONTHS = 5

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

function placeholderSvg(label: string, subtitle: string, hue: number) {
  const hue2 = (hue + 40) % 360
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 70% 62%)"/>
      <stop offset="1" stop-color="hsl(${hue2} 70% 42%)"/>
    </linearGradient>
  </defs>
  <rect width="640" height="480" fill="url(#g)"/>
  <rect x="180" y="148" width="280" height="184" rx="16" fill="#ffffff" opacity="0.92"/>
  <text x="320" y="248" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="700" text-anchor="middle" fill="#1f2937">${label}</text>
  <text x="320" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="20" text-anchor="middle" fill="#4b5563">${subtitle}</text>
</svg>
`
}

async function removeDemo() {
  const asset = await db.asset.findUnique({ where: { code: DEMO_CODE } })
  if (asset) {
    await db.asset.delete({ where: { id: asset.id } })
  }
  const blobs = await db.fileBlob.deleteMany({
    where: { fileName: { startsWith: DEMO_FILE_PREFIX } },
  })
  console.log(
    `Hapus data contoh selesai. Aset dihapus: ${asset ? 1 : 0}, file placeholder dihapus: ${blobs.count}`
  )
}

async function addDemo() {
  const category =
    (await db.category.findFirst({ where: { name: "Laptop" } })) ??
    (await db.category.findFirst())
  if (!category) {
    throw new Error("Belum ada kategori. Jalankan `npx prisma db seed` dulu.")
  }

  const previous = await db.asset.findUnique({ where: { code: DEMO_CODE } })
  if (previous) {
    await db.asset.delete({ where: { id: previous.id } })
    await db.fileBlob.deleteMany({
      where: { fileName: { startsWith: DEMO_FILE_PREFIX } },
    })
  }

  const now = new Date()
  const entries: { url: string; createdAt: Date; label: string }[] = []

  for (let index = MONTHS - 1; index >= 0; index -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1)
    )
    const label = `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`
    const fileName = `${DEMO_FILE_PREFIX}${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1
    ).padStart(2, "0")}.svg`
    const svg = placeholderSvg(label, "Contoh foto aset", (index * 46) % 360)
    const data = Buffer.from(svg, "utf8")

    const blob = await db.fileBlob.create({
      data: {
        fileName,
        mimeType: "image/svg+xml",
        size: data.byteLength,
        kind: "image",
        data,
        createdAt: date,
      },
    })
    entries.push({ url: `/api/files/${blob.id}`, createdAt: date, label })
  }

  const current = entries[entries.length - 1]
  const history = entries.slice(0, -1)

  const asset = await db.asset.create({
    data: {
      categoryId: category.id,
      name: "Demo — Riwayat Foto Aset",
      code: DEMO_CODE,
      serialNumber: "DEMO-SN-0001",
      condition: "Good",
      imageUrl: current.url,
      recordDate: now,
      note: "Aset contoh untuk mencoba strip riwayat foto dan tombol \"Jadikan foto aktif\". Hapus dengan `npx tsx prisma/demo-history.ts --remove`.",
      updatedBy: "Demo",
    },
  })

  await db.assetFileHistory.createMany({
    data: history.map((entry) => ({
      assetId: asset.id,
      kind: "image",
      url: entry.url,
      fileName: `${DEMO_FILE_PREFIX}${entry.createdAt.toISOString().slice(0, 7)}.svg`,
      createdBy: "Demo",
      createdAt: entry.createdAt,
    })),
  })

  console.log(`Aset contoh dibuat: #${asset.id} (${DEMO_CODE})`)
  console.log(`Foto aktif: ${current.label}`)
  console.log(
    `Riwayat: ${history
      .map((entry) => entry.label)
      .reverse()
      .join(", ")}`
  )
  console.log("Buka halaman Assets lalu klik aset ini untuk melihat preview.")
}

const shouldRemove = process.argv.includes("--remove")

async function main() {
  if (shouldRemove) {
    await removeDemo()
  } else {
    await addDemo()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
