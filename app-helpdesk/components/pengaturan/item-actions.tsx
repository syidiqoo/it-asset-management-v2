"use client"

import { Pencil, Trash2 } from "lucide-react"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"

export function ItemActions({
  label,
  onEdit,
  onDelete,
  blockReason,
}: {
  label: string
  onEdit: () => void
  onDelete: () => void
  blockReason?: string | null
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton size="small" aria-label={`Edit ${label}`} onClick={onEdit}>
        <Pencil className="size-4" />
      </IconButton>

      {blockReason ? (
        <Tooltip title={blockReason}>
          <span className="inline-flex">
            <IconButton
              size="small"
              disabled
              aria-label={`Delete ${label}`}
            >
              <Trash2 className="size-4" />
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <IconButton
          size="small"
          aria-label={`Delete ${label}`}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </IconButton>
      )}
    </div>
  )
}
