"use client"

import { Building2, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { flattenDepartments, MAX_DEPARTMENT_LEVEL } from "@/lib/departments"
import type { Department, DepartmentNode } from "@/lib/types"

export function DepartmentTree({
  departments,
  onAddChild,
  onEdit,
  onDelete,
  deleteBlockReason,
}: {
  departments: Department[]
  onAddChild: (department: DepartmentNode) => void
  onEdit: (department: DepartmentNode) => void
  onDelete: (department: DepartmentNode) => void
  deleteBlockReason: (department: DepartmentNode) => string | null
}) {
  const nodes = flattenDepartments(departments)

  if (nodes.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        No departments yet.
      </p>
    )
  }

  return (
    <div>
      {nodes.map((node) => {
        const reason = deleteBlockReason(node)
        const canAddChild = node.level < MAX_DEPARTMENT_LEVEL

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
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">{node.name}</span>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              Lv {node.level}
            </Badge>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {canAddChild ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Add sub-department ${node.name}`}
                  onClick={() => onAddChild(node)}
                >
                  <Plus />
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled
                      aria-label={`Add sub-department ${node.name}`}
                    >
                      <Plus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Maximum {MAX_DEPARTMENT_LEVEL} department levels.
                  </TooltipContent>
                </Tooltip>
              )}

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${node.name}`}
                onClick={() => onEdit(node)}
              >
                <Pencil />
              </Button>

              {reason ? (
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled
                      aria-label={`Delete ${node.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{reason}</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${node.name}`}
                  onClick={() => onDelete(node)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
