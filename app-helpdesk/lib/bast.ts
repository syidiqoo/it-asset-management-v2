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
  "All inventory assets handed over under this report are intended for the company's business purposes and not for personal use.",
  "Upon signing this document, all responsibility for the listed inventory items TRANSFERS to the receiving party, who must safeguard and maintain those items.",
  "If physical damage or defects occur to the items during the receiving party's use, the receiving party MUST compensate the assessed value of the damage according to the valuation of the damaged items or components.",
  "These terms take effect once both the delivering and receiving parties sign this handover document.",
]

export const BAST_CITY_DEFAULT = "Pangandaran"

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
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
  const name = receiverName.trim() || "No Recipient"
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
