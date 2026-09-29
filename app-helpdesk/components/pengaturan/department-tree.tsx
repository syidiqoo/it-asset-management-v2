"use client"

import * as React from "react"
import { Building2, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"

import { buildDepartmentTree, MAX_DEPARTMENT_LEVEL } from "@/lib/departments"
import { cn } from "@/lib/utils"
import type { Department, DepartmentNode } from "@/lib/types"

export function DepartmentTree({
  departments,
  onAddChild,
  onEdit,
  onDelete,
  deleteBlockReason,
  emptyLabel = "No departments yet.",
}: {
  departments: Department[]
  onAddChild: (department: DepartmentNode) => void
  onEdit: (department: DepartmentNode) => void
  onDelete: (department: DepartmentNode) => void
  deleteBlockReason: (department: DepartmentNode) => string | null
  emptyLabel?: string
}) {
  const [collapsed, setCollapsed] = React.useState<Set<number>>(
    () => new Set()
  )

  const rows = React.useMemo(() => {
    const result: { node: DepartmentNode; hasChildren: boolean }[] = []

    const walk = (items: DepartmentNode[]) => {
      for (const item of items) {
        result.push({ node: item, hasChildren: item.children.length > 0 })
        if (item.children.length > 0 && !collapsed.has(item.id)) {
          walk(item.children)
        }
      }
    }

    walk(buildDepartmentTree(departments))
    return result
  }, [departments, collapsed])

  const toggle = (id: number) =>
    setCollapsed((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    )
  }

  return (
    <div>
      {rows.map(({ node, hasChildren }) => {
        const reason = deleteBlockReason(node)
        const canAddChild = node.level < MAX_DEPARTMENT_LEVEL
        const expanded = hasChildren && !collapsed.has(node.id)

        return (
          <div
            key={node.id}
            className="flex items-center gap-2 border-b px-4 py-2 last:border-b-0"
          >
            <span
              aria-hidden
              className="shrink-0"
              style={{ width: (node.level - 1) * 20 }}
            />

            {hasChildren ? (
              <IconButton
                size="small"
                className="shrink-0"
                aria-label={`${expanded ? "Collapse" : "Expand"} ${node.name}`}
                aria-expanded={expanded}
                onClick={() => toggle(node.id)}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    !expanded && "-rotate-90"
                  )}
                />
              </IconButton>
            ) : (
              <span aria-hidden className="size-7 shrink-0" />
            )}

            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">{node.name}</span>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {canAddChild ? (
                <IconButton
                  size="small"
                  aria-label={`Add sub-department ${node.name}`}
                  onClick={() => onAddChild(node)}
                >
                  <Plus className="size-4" />
                </IconButton>
              ) : (
                <Tooltip
                  title={`Maximum ${MAX_DEPARTMENT_LEVEL} department levels.`}
                >
                  <span className="inline-flex">
                    <IconButton
                      size="small"
                      disabled
                      aria-label={`Add sub-department ${node.name}`}
                    >
                      <Plus className="size-4" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              <IconButton
                size="small"
                aria-label={`Edit ${node.name}`}
                onClick={() => onEdit(node)}
              >
                <Pencil className="size-4" />
              </IconButton>

              {reason ? (
                <Tooltip title={reason}>
                  <span className="inline-flex">
                    <IconButton
                      size="small"
                      disabled
                      aria-label={`Delete ${node.name}`}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <IconButton
                  size="small"
                  aria-label={`Delete ${node.name}`}
                  onClick={() => onDelete(node)}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
