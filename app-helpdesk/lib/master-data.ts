import { collectDescendantIds } from "@/lib/departments"
import type { FilterValues } from "@/lib/filters"
import type {
  Category,
  Department,
  Employee,
  Location,
  SimPackage,
} from "@/lib/types"

export const CATEGORY_FILTER_NAMES = ["q"]
export const EMPLOYEE_FILTER_NAMES = ["q", "department"]
export const DEPARTMENT_FILTER_NAMES = ["q", "top"]
export const SIM_PACKAGE_FILTER_NAMES = ["q"]
export const LOCATION_FILTER_NAMES = ["q", "coordinates"]

function includesText(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query)
}

export function filterNamed<T extends { name: string }>(
  items: T[],
  values: FilterValues
): T[] {
  const query = (values.q ?? "").trim().toLowerCase()
  if (!query) return items
  return items.filter((item) => includesText(item.name, query))
}

export function filterCategories(
  categories: Category[],
  values: FilterValues
): Category[] {
  return filterNamed(categories, values)
}

export function filterSimPackages(
  simPackages: SimPackage[],
  values: FilterValues
): SimPackage[] {
  return filterNamed(simPackages, values)
}

export function filterEmployees(
  employees: Employee[],
  values: FilterValues,
  options: { departmentIds: Set<number> | null }
): Employee[] {
  const query = (values.q ?? "").trim().toLowerCase()

  return employees.filter((employee) => {
    if (
      options.departmentIds &&
      (employee.departmentId === null ||
        !options.departmentIds.has(employee.departmentId))
    ) {
      return false
    }
    if (query && !includesText(employee.name, query)) return false
    return true
  })
}

export function filterDepartments(
  departments: Department[],
  values: FilterValues
): Department[] {
  const query = (values.q ?? "").trim().toLowerCase()
  const top = values.top ?? ""

  const byId = new Map(departments.map((department) => [department.id, department]))
  const scopeIds = top
    ? collectDescendantIds(departments, Number(top))
    : null
  const inScope = (department: Department) =>
    scopeIds === null || scopeIds.has(department.id)

  if (!query) return departments.filter(inScope)

  // Keep matches together with their ancestors so the hierarchy path and
  // level badges stay intact.
  const keep = new Set<number>()

  for (const department of departments) {
    if (!inScope(department) || !includesText(department.name, query)) continue
    keep.add(department.id)

    let parentId = department.parentId
    while (parentId !== null) {
      const parent = byId.get(parentId)
      if (!parent || !inScope(parent)) break
      keep.add(parent.id)
      parentId = parent.parentId
    }
  }

  return departments.filter((department) => keep.has(department.id))
}

export function filterLocations(
  locations: Location[],
  values: FilterValues
): Location[] {
  const query = (values.q ?? "").trim().toLowerCase()
  const coordinates = values.coordinates ?? ""

  return locations.filter((location) => {
    const plotted = location.latitude !== null && location.longitude !== null
    if (coordinates === "with" && !plotted) return false
    if (coordinates === "without" && plotted) return false

    if (query) {
      const haystack = `${location.code} ${location.address ?? ""} ${
        location.detailStreetAddress
      }`
      if (!includesText(haystack, query)) return false
    }

    return true
  })
}
