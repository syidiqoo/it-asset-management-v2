import type { FilterValues } from "@/lib/filters"
import type { InternetData } from "@/lib/types"

export const INTERNET_PAGE_SIZE = 100

export const INTERNET_FILTER_NAMES = ["q", "location", "service"]

export function normalizeInternetId(value: string): string {
  const digits = value.replace(/\D/g, "")
  return digits.replace(/^0+(?=\d)/, "")
}

export function validateInternetId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return "Internet ID is required."
  if (!/^\d+$/.test(trimmed)) {
    return "Internet ID must contain only digits."
  }
  if (!normalizeInternetId(trimmed)) {
    return "Internet ID cannot be only zeros."
  }
  return null
}

export function filterInternetData(
  items: InternetData[],
  values: FilterValues,
  options: { locationLabel: (id: number | null) => string }
): InternetData[] {
  const query = (values.q ?? "").trim().toLowerCase()
  const location = values.location ?? ""
  const service = values.service ?? ""

  return items.filter((item) => {
    if (location && String(item.locationId ?? "") !== location) return false
    if (service && item.service !== service) return false

    if (query) {
      const haystack = [
        item.internetId,
        item.customerName,
        item.service,
        options.locationLabel(item.locationId),
      ]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })
}
