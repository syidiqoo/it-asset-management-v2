"use client"

import { ItemActions } from "@/components/pengaturan/item-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function EntityList({
  items,
  onEdit,
  onDelete,
  blockReason,
}: {
  items: { id: number; name: string }[]
  onEdit: (item: { id: number; name: string }) => void
  onDelete: (item: { id: number; name: string }) => void
  blockReason?: (id: number) => string | null
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        No data yet.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Name</TableHead>
          <TableHead className="pr-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="pl-4 font-medium">{item.name}</TableCell>
            <TableCell className="pr-4">
              <ItemActions
                label={item.name}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                blockReason={blockReason?.(item.id) ?? null}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
