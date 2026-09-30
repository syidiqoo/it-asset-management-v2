"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { ItemActions } from "@/components/pengaturan/item-actions"
import { PositionDialog } from "@/components/pengaturan/dialogs/position-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { departmentName, collectDescendantIds, flattenDepartments } from "@/lib/departments"
import {
  hasActiveFilters,
  type FilterField,
  type FilterValues,
} from "@/lib/filters"
import { filterPositions } from "@/lib/master-data"
import type { Position } from "@/lib/types"

export function PositionView({ values }: { values: FilterValues }) {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Position | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Position | null>(
    null
  )

  const departmentIds = React.useMemo(
    () =>
      values.department
        ? collectDescendantIds(store.departments, Number(values.department))
        : null,
    [store.departments, values.department]
  )

  const filtered = React.useMemo(
    () => filterPositions(store.positions, values, { departmentIds }),
    [store.positions, values, departmentIds]
  )

  const fields: FilterField[] = [
    {
      type: "search",
      name: "q",
      label: "Search",
      placeholder: "Position name",
    },
    {
      type: "select",
      name: "department",
      label: "Department",
      allLabel: "All departments",
      options: flattenDepartments(store.departments).map((department) => ({
        label: department.path,
        value: String(department.id),
      })),
    },
  ]

  const submit = async (
    name: string,
    departmentId: number | null
  ): Promise<string | null> => {
    const editing = dialog.item

    try {
      if (editing) await store.updatePosition(editing.id, { name, departmentId })
      else await store.createPosition({ name, departmentId })
    } catch (err) {
      return err instanceof Error ? err.message : "Save failed."
    }
    return null
  }

  const blockReason = (id: number) =>
    store.employees.some((employee) => employee.positionId === id)
      ? "Position is still used by employees."
      : null

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Position"
          description="Job titles per department, used as employee positions."
          actions={
            <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
              <Plus />
              Add Position
            </Button>
          }
        />
        <FilterBar fields={fields} values={values} />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <StoreState
          loading={store.loading}
          error={store.error}
          onRetry={store.refresh}
          empty={false}
        >
          <div className="contents">
            <Card size="sm" className="py-0">
              <CardContent className="px-0">
                {filtered.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {hasActiveFilters(values)
                      ? "No results found. Change keywords or reset filters."
                      : "No data yet."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="pr-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="pl-4 font-medium">
                            {position.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {departmentName(
                              store.departments,
                              position.departmentId
                            ) ?? "—"}
                          </TableCell>
                          <TableCell className="pr-4">
                            <ItemActions
                              label={position.name}
                              blockReason={blockReason(position.id)}
                              onEdit={() =>
                                setDialog({ open: true, item: position })
                              }
                              onDelete={() => setPendingDelete(position)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </StoreState>
      </div>

      <PositionDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((previous) => ({ ...previous, open }))
        }
        position={dialog.item}
        departments={store.departments}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete ${pendingDelete?.name}?`}
        description="Position will be removed from master data. This action cannot be undone."
        onConfirm={async () => {
          if (!pendingDelete) return
          try {
            await store.deletePosition(pendingDelete.id)
          } catch (error) {
            return error instanceof Error ? error.message : "Delete failed."
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
