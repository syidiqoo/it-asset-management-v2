import type { FilterValues } from "@/lib/filters"
import type { Asset } from "@/lib/types"

export const ASSET_PAGE_SIZE = 100

export const ASSET_FILTER_NAMES = [
  "q",
  "category",
  "condition",
  "department",
]

export const CSV_IMPORT_COLUMNS = [
  "Category",
  "Asset Name",
  "Code",
  "Serial Number",
  "Employee",
  "Department",
  "Condition",
  "Purchase Date",
  "Note",
]

export type AssetSectionKey = "main" | "available" | "broken"

export const ASSET_SECTION_LABEL: Record<AssetSectionKey, string> = {
  main: "Main Asset",
  available: "Available Asset",
  broken: "Broken Asset",
}

export function assetSection(asset: Asset): AssetSectionKey {
  if (asset.condition === "Damaged" || asset.condition === "Under Repair") {
    return "broken"
  }
  if (asset.employeeId === null) {
    return "available"
  }
  return "main"
}

export function filterAssets(
  assets: Asset[],
  values: FilterValues,
  options: {
    departmentIds: Set<number> | null
    employeeName: (id: number | null) => string
  }
): Asset[] {
  const query = (values.q ?? "").trim().toLowerCase()
  const category = values.category ?? ""
  const condition = values.condition ?? ""

  return assets.filter((asset) => {
    if (category && asset.categoryId !== Number(category)) {
      return false
    }
    if (condition && asset.condition !== condition) {
      return false
    }
    if (
      options.departmentIds &&
      (asset.departmentId === null ||
        !options.departmentIds.has(asset.departmentId))
    ) {
      return false
    }
    if (query) {
      const haystack = [
        asset.name,
        asset.code,
        asset.serialNumber ?? "",
        options.employeeName(asset.employeeId),
      ]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}
