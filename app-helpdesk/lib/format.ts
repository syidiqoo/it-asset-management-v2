import type { Condition } from "@/lib/types"

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return "—"
  return dateFormatter.format(date)
}

export const CONDITION_BADGE_CLASS: Record<Condition, string> = {
  Good: "border-emerald-600/20 bg-emerald-50 text-emerald-700",
  Fair: "border-amber-600/20 bg-amber-50 text-amber-700",
  Damaged: "border-red-600/20 bg-red-50 text-red-700",
  "Under Repair": "border-blue-600/20 bg-blue-50 text-blue-700",
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}
