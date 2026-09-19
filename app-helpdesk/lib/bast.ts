export type BastItem = {
  id: number
  name: string
  serialNumber: string | null
}

export type BastDocument = {
  date: string
  place: string
  receiverName: string
  receiverDepartment: string
  giverName: string
  accessories: string[]
  items: BastItem[]
}

export const BAST_RULES = [
  "Seluruh Aset barang inventaris yang diserahkan pada berita acara ini ditunjukan untuk kepentingan bisnis perusahaan dan bukan untuk kepentingan pribadi.",
  "Bersamaan dengan penandatanganan surat ini, maka seluruh tanggung jawab atas barang inventaris yang tertulis BERPINDAH TANGAN kepada pihak yang menerima barang tersebut untuk menjaga dan merawat barang tersebut.",
  "Bila terjadi kerusakan atau cacat secara fisik pada barang saat masa pemakaian barang tersebut oleh pihak penerima, maka pihak penerima HARUS mengganti nilai valuasi kerusakan barang tersebut sesuai dengan valuasi kerusakan barang atau komponennya.",
  "Aturan ini berlaku setelah pihak yang menyerahkan dan pihak penerima menandatangani surat serah terima ini.",
]

export const BAST_CITY_DEFAULT = "Pangandaran"

const dayFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

function toDate(value: string): Date | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatBastDay(value: string): string {
  const date = toDate(value)
  return date ? dayFormatter.format(date) : "—"
}

export function formatBastDate(value: string): string {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : "—"
}

export function bastFileName(receiverName: string, date: string): string {
  const name = receiverName.trim() || "Tanpa Penerima"
  const safeName = name.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ")
  const parts = date ? date.split("-").reverse() : []
  const datePart = parts.length === 3 ? parts.join("-") : ""
  return ["BAST", safeName, datePart].filter(Boolean).join(" - ")
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}
