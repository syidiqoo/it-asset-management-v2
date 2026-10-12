export type FilterValues = Record<string, string>

export type FilterField =
  | { type: "search"; name: string; label: string; placeholder: string }
  | {
      type: "select"
      name: string
      label: string
      allLabel: string
      options: { label: string; value: string }[]
      searchable?: boolean
    }

export function parseFilterValues(
  searchParams: Record<string, string | string[] | undefined>,
  names: string[]
): { values: FilterValues; page: number } {
  const values: FilterValues = {}

  for (const name of names) {
    const raw = searchParams[name]
    values[name] = typeof raw === "string" ? raw : ""
  }

  const rawPage = searchParams.page
  const parsed = typeof rawPage === "string" ? Number.parseInt(rawPage, 10) : 1

  return { values, page: Number.isFinite(parsed) && parsed > 0 ? parsed : 1 }
}

export function buildFilterQuery(values: FilterValues, page: number): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value)
  }
  if (page > 1) params.set("page", String(page))

  return params.toString()
}

export function hasActiveFilters(values: FilterValues): boolean {
  return Object.values(values).some((value) => value !== "")
}

const PIN_KEY = "filter-pins"

export function getPinned(pathname: string): boolean {
  if (typeof window === "undefined") return false
  try {
    const raw = sessionStorage.getItem(PIN_KEY)
    if (!raw) return false
    const pins: Record<string, true> = JSON.parse(raw)
    return pins[pathname] === true
  } catch {
    return false
  }
}

export function setPinned(pathname: string, values: FilterValues | null): void {
  if (typeof window === "undefined") return
  try {
    if (values) {
      // Store current filter values so they can be restored on refresh
      const query = buildFilterQuery(values, 1)
      sessionStorage.setItem(`filter-state:${pathname}`, query)

      const raw = sessionStorage.getItem(PIN_KEY)
      const pins: Record<string, true> = raw ? JSON.parse(raw) : {}
      pins[pathname] = true
      sessionStorage.setItem(PIN_KEY, JSON.stringify(pins))
    } else {
      const raw = sessionStorage.getItem(PIN_KEY)
      const pins: Record<string, true> = raw ? JSON.parse(raw) : {}
      delete pins[pathname]
      sessionStorage.setItem(PIN_KEY, JSON.stringify(pins))
      sessionStorage.removeItem(`filter-state:${pathname}`)
    }
  } catch {
    // sessionStorage not available
  }
}

export function restorePinnedFilters(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
  names: string[]
): FilterValues | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PIN_KEY)
    if (!raw) return null
    const pins: Record<string, true> = JSON.parse(raw)
    if (!pins[pathname]) return null

    const state = sessionStorage.getItem(`filter-state:${pathname}`)
    if (!state) return null

    const params = new URLSearchParams(state)
    const values: FilterValues = {}
    for (const name of names) {
      values[name] = params.get(name) ?? ""
    }
    return values
  } catch {
    return null
  }
}
