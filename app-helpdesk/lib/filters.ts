export type FilterValues = Record<string, string>

export type FilterField =
  | { type: "search"; name: string; label: string; placeholder: string }
  | {
      type: "select"
      name: string
      label: string
      allLabel: string
      options: { label: string; value: string }[]
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
