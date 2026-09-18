import type { FilterValues } from "@/lib/filters"
import type { SimCard } from "@/lib/types"

export const SIM_CARD_PAGE_SIZE = 100

export const SIM_CARD_FILTER_NAMES = [
  "q",
  "employee",
  "department",
  "package",
]

export function filterSimCards(
  simCards: SimCard[],
  values: FilterValues,
  options: {
    departmentIds: Set<number> | null
    searchText: (card: SimCard) => string
  }
): SimCard[] {
  const query = (values.q ?? "").trim().toLowerCase()
  const employee = values.employee ?? ""
  const packageId = values.package ?? ""

  return simCards.filter((card) => {
    if (employee && String(card.employeeId ?? "") !== employee) {
      return false
    }
    if (packageId && String(card.packageId ?? "") !== packageId) {
      return false
    }
    if (
      options.departmentIds &&
      (card.departmentId === null ||
        !options.departmentIds.has(card.departmentId))
    ) {
      return false
    }
    if (query && !options.searchText(card).toLowerCase().includes(query)) {
      return false
    }
    return true
  })
}
