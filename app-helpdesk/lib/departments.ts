import type { Department, DepartmentNode } from "@/lib/types"

export const MAX_DEPARTMENT_LEVEL = 4

export function buildDepartmentTree(
  departments: Department[]
): DepartmentNode[] {
  const nodes = new Map<number, DepartmentNode>()
  for (const department of departments) {
    nodes.set(department.id, {
      ...department,
      level: 1,
      path: department.name,
      children: [],
    })
  }

  const roots: DepartmentNode[] = []
  for (const node of nodes.values()) {
    const parent = node.parentId === null ? null : nodes.get(node.parentId)
    if (!parent) {
      roots.push(node)
      continue
    }
    parent.children.push(node)
  }

  const assign = (items: DepartmentNode[], parent: DepartmentNode | null) => {
    for (const item of items) {
      item.level = parent ? parent.level + 1 : 1
      item.path = parent ? `${parent.path} > ${item.name}` : item.name
      assign(item.children, item)
    }
  }
  assign(roots, null)

  return roots
}

export function flattenDepartments(departments: Department[]): DepartmentNode[] {
  const result: DepartmentNode[] = []
  const walk = (nodes: DepartmentNode[]) => {
    for (const node of nodes) {
      result.push(node)
      walk(node.children)
    }
  }
  walk(buildDepartmentTree(departments))
  return result
}

export function departmentPath(
  departments: Department[],
  id: number | null
): string | null {
  if (id === null) return null
  return (
    flattenDepartments(departments).find((item) => item.id === id)?.path ?? null
  )
}

export function departmentName(
  departments: Department[],
  id: number | null
): string | null {
  if (id === null) return null
  return departments.find((item) => item.id === id)?.name ?? null
}

export function collectDescendantIds(
  departments: { id: number; parentId: number | null }[],
  rootId: number
): Set<number> {
  const ids = new Set<number>([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const department of departments) {
      if (
        department.parentId !== null &&
        ids.has(department.parentId) &&
        !ids.has(department.id)
      ) {
        ids.add(department.id)
        changed = true
      }
    }
  }
  return ids
}

export function departmentSubtreeDepth(
  departments: { id: number; parentId: number | null }[],
  rootId: number
): number {
  const childrenOf = (id: number) =>
    departments.filter((item) => item.parentId === id)

  const walk = (id: number): number => {
    const children = childrenOf(id)
    if (children.length === 0) return 0
    return 1 + Math.max(...children.map((child) => walk(child.id)))
  }

  return walk(rootId)
}
