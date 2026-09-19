import type { FilterValues } from "@/lib/filters"
import type { AppUser, Role } from "@/lib/types"

export const USER_FILTER_NAMES = ["q", "role"]

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  guest: "Guest",
}

export function filterUsers(
  users: AppUser[],
  values: FilterValues
): AppUser[] {
  const query = (values.q ?? "").trim().toLowerCase()
  const role = values.role ?? ""

  return users.filter((user) => {
    if (role && user.role !== role) return false
    if (query) {
      const haystack = `${user.name} ${user.username}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}
