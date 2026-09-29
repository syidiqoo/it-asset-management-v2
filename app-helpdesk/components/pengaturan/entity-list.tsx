"use client"

import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"

import { ItemActions } from "@/components/pengaturan/item-actions"

export function EntityList({
  items,
  onEdit,
  onDelete,
  blockReason,
  emptyLabel = "No data yet.",
}: {
  items: { id: number; name: string }[]
  onEdit: (item: { id: number; name: string }) => void
  onDelete: (item: { id: number; name: string }) => void
  blockReason?: (id: number) => string | null
  emptyLabel?: string
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    )
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell align="right">
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
