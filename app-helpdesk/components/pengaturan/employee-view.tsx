"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { StoreState } from "@/components/store-state"
import { CsvActions } from "@/components/csv-actions"
import { PageHeader } from "@/components/page-header"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { EmployeeDialog } from "@/components/pengaturan/dialogs/employee-dialog"
import { ItemActions } from "@/components/pengaturan/item-actions"
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
import { csvFileName, downloadCsv } from "@/lib/csv"
import { departmentName, departmentPath } from "@/lib/departments"
import type { Employee } from "@/lib/types"

const CSV_COLUMNS = ["Name", "Department"]

export function EmployeeView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Employee | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Employee | null>(null)

  const submit = async (name: string, departmentId: number | null) => {
    const editing = dialog.item

    try {
      if (editing) await store.updateEmployee(editing.id, name, departmentId)
      else await store.createEmployee(name, departmentId)
    } catch (err) {
      return err instanceof Error ? err.message : "Save failed."
    }
    return null
  }

  const blockReason = (id: number) => {
    if (store.assets.some((asset) => asset.employeeId === id)) {
      return "Employee still holds assets."
    }
    if (store.simCards.some((card) => card.employeeId === id)) {
      return "Employee still holds SIM cards."
    }
    return null
  }

  const exportCsv = () => {
    downloadCsv(
      csvFileName("employee"),
      CSV_COLUMNS,
      store.employees.map((employee) => [
        employee.name,
        departmentPath(store.departments, employee.departmentId) ?? "",
      ])
    )
  }

  const importCsv = async (rows: string[][]) => {
    return store.importEmployees(rows)
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Employee"
        description="Asset and SIM card holders."
        actions={
          <>
            <CsvActions
              columns={CSV_COLUMNS}
              onExport={exportCsv}
              fileHint="Columns: Name, Department — or the sample format: ID, Nama, ..., Posisi."
              note="Import is all-or-nothing: one bad row cancels the whole process. Department must already exist; rows whose name already exists are skipped."
              onImport={importCsv}
            />
            <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
              <Plus />
              Add Employee
            </Button>
          </>
        }
      />

      <StoreState
        loading={store.loading}
        error={store.error}
        onRetry={store.refresh}
        empty={false}
      >
      <Card size="sm" className="py-0">
        <CardContent className="px-0">
          {store.employees.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No data yet.
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
                {store.employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="pl-4 font-medium">
                      {employee.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {departmentName(
                        store.departments,
                        employee.departmentId
                      ) ?? "—"}
                    </TableCell>
                    <TableCell className="pr-4">
                      <ItemActions
                        label={employee.name}
                        blockReason={blockReason(employee.id)}
                        onEdit={() =>
                          setDialog({ open: true, item: employee })
                        }
                        onDelete={() => setPendingDelete(employee)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </StoreState>

      <EmployeeDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((previous) => ({ ...previous, open }))
        }
        employee={dialog.item}
        departments={store.departments}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete ${pendingDelete?.name}?`}
        description="Employee will be removed from master data. This action cannot be undone."
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await store.deleteEmployee(pendingDelete.id)
            } catch {
              return
            }
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
