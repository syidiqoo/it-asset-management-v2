import { flattenDepartments } from "@/lib/departments"
import type {
  Asset,
  Category,
  Department,
  DepartmentNode,
  Employee,
  InternetData,
  Location,
  Position,
  SimCard,
} from "@/lib/types"

export type SummaryItemIcon =
  | "laptop"
  | "phone"
  | "monitor"
  | "printer"
  | "sim"
  | "other"

export type SummaryItem = {
  icon: SummaryItemIcon
  label: string
  value: string
}

export type SummaryPerson = {
  employee: Employee
  positionLabel: string | null
  items: SummaryItem[]
}

export type SummaryUnit = {
  department: DepartmentNode
  location: string | null
  internet: InternetData[]
  persons: SummaryPerson[]
  units: SummaryUnit[]
}

export type SummaryCard = {
  departmentId: number
  title: string
  location: string | null
  internet: InternetData[]
  persons: SummaryPerson[]
  units: SummaryUnit[]
}

export type SummaryInput = {
  departments: Department[]
  positions: Position[]
  employees: Employee[]
  assets: Asset[]
  simCards: SimCard[]
  categories: Category[]
  internetData: InternetData[]
  locations: Location[]
}

function categoryIcon(name: string): SummaryItemIcon {
  const value = name.toLowerCase()
  if (value.includes("laptop") || value.includes("notebook")) return "laptop"
  if (
    value.includes("phone") ||
    value.includes("ponsel") ||
    value.includes("handphone") ||
    value.includes("tablet")
  ) {
    return "phone"
  }
  if (value.includes("printer")) return "printer"
  if (
    value.includes("pc") ||
    value.includes("komputer") ||
    value.includes("computer") ||
    value.includes("desktop")
  ) {
    return "monitor"
  }
  return "other"
}

function locationLabelFor(
  locationId: number | null,
  input: SummaryInput
): string | null {
  if (locationId === null) return null
  const location = input.locations.find((item) => item.id === locationId)
  if (!location) return null
  return `${location.code} · ${location.address ?? location.detailStreetAddress}`
}

function employeesByDepartmentMap(employees: Employee[]) {
  const map = new Map<number, Employee[]>()
  for (const employee of employees) {
    if (employee.departmentId === null) continue
    const list = map.get(employee.departmentId) ?? []
    list.push(employee)
    map.set(employee.departmentId, list)
  }
  return map
}

function buildPersons(
  employees: Employee[],
  input: SummaryInput
): SummaryPerson[] {
  const assetsByEmployee = new Map<number, Asset[]>()
  for (const asset of input.assets) {
    if (asset.employeeId === null) continue
    const list = assetsByEmployee.get(asset.employeeId) ?? []
    list.push(asset)
    assetsByEmployee.set(asset.employeeId, list)
  }

  const simsByEmployee = new Map<number, SimCard[]>()
  for (const sim of input.simCards) {
    if (sim.employeeId === null) continue
    const list = simsByEmployee.get(sim.employeeId) ?? []
    list.push(sim)
    simsByEmployee.set(sim.employeeId, list)
  }

  const categoryById = new Map(
    input.categories.map((item) => [item.id, item.name])
  )
  const positionById = new Map(
    input.positions.map((item) => [item.id, item.name])
  )

  return [...employees]
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .map((employee) => {
      const items: SummaryItem[] = []

      for (const asset of assetsByEmployee.get(employee.id) ?? []) {
        const label = categoryById.get(asset.categoryId) ?? "Asset"
        items.push({ icon: categoryIcon(label), label, value: asset.name })
      }
      for (const sim of simsByEmployee.get(employee.id) ?? []) {
        items.push({ icon: "sim", label: "SIM", value: sim.phoneNumber })
      }

      items.sort(
        (a, b) =>
          a.label.localeCompare(b.label) || a.value.localeCompare(b.value)
      )

      return {
        employee,
        positionLabel:
          employee.positionId === null
            ? null
            : (positionById.get(employee.positionId) ?? null),
        items,
      }
    })
}

function buildUnit(
  node: DepartmentNode,
  employeesByDepartment: Map<number, Employee[]>,
  input: SummaryInput
): SummaryUnit {
  const persons = buildPersons(employeesByDepartment.get(node.id) ?? [], input)
  const units = [...node.children]
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .map((child) => buildUnit(child, employeesByDepartment, input))

  const internet =
    node.locationId === null
      ? []
      : input.internetData.filter((item) => item.locationId === node.locationId)

  return {
    department: node,
    location: locationLabelFor(node.locationId, input),
    internet,
    persons,
    units,
  }
}

export function summarizeDepartment(
  department: Department,
  input: SummaryInput
): SummaryCard | null {
  const nodes = flattenDepartments(input.departments)
  const root = nodes.find((node) => node.id === department.id)
  if (!root) return null

  const employeesByDepartment = employeesByDepartmentMap(input.employees)
  const persons = buildPersons(employeesByDepartment.get(root.id) ?? [], input)
  const units = [...root.children]
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .map((child) => buildUnit(child, employeesByDepartment, input))

  const internet =
    root.locationId === null
      ? []
      : input.internetData.filter((item) => item.locationId === root.locationId)

  return {
    departmentId: root.id,
    title: root.name,
    location: locationLabelFor(root.locationId, input),
    internet,
    persons,
    units,
  }
}
