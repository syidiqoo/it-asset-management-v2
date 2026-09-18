"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
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
import { departmentPath } from "@/lib/departments"
import type { Employee } from "@/lib/types"

const CSV_COLUMNS = ["Nama", "Department"]

export function EmployeeView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Employee | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Employee | null>(null)

  const submit = (name: string, departmentId: number | null) => {
    const editing = dialog.item

    if (editing) store.updateEmployee(editing.id, name, departmentId)
    else store.createEmployee(name, departmentId)
    return null
  }

  const blockReason = (id: number) => {
    if (store.assets.some((asset) => asset.employeeId === id)) {
      return "Employee masih memegang aset."
    }
    if (store.simCards.some((card) => card.employeeId === id)) {
      return "Employee masih memegang SIM card."
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

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Employee"
        description="Pemegang aset dan SIM card."
        actions={
          <>
            <CsvActions
              columns={CSV_COLUMNS}
              onExport={exportCsv}
              fileHint="Format CSV, baris pertama adalah nama kolom."
              note="File harus punya baris header sesuai kolom di atas. Data master yang belum ada akan dibuat otomatis. Penulisan ke database belum aktif pada tahap UI ini."
            />
            <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
              <Plus />
              Tambah Employee
            </Button>
          </>
        }
      />

      <Card size="sm" className="py-0">
        <CardContent className="px-0">
          {store.employees.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Belum ada data.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nama</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="pl-4 font-medium">
                      {employee.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {departmentPath(
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
        title={`Hapus ${pendingDelete?.name}?`}
        description="Employee akan dihapus dari master data. Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          if (pendingDelete) store.deleteEmployee(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
