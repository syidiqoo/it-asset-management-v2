"use client"

import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${label}`}
        onClick={onEdit}
      >
        <Pencil />
      </Button>

      {blockReason ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled
              aria-label={`Hapus ${label}`}
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{blockReason}</TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Hapus ${label}`}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  )
}
