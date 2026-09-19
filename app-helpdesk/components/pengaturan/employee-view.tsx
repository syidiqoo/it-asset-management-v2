"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { CsvActions } from "@/components/csv-actions"
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
import {
  collectDescendantIds,
  departmentName,
  departmentPath,
  flattenDepartments,
} from "@/lib/departments"
import {
  hasActiveFilters,
  type FilterField,
  type FilterValues,
} from "@/lib/filters"
import { filterEmployees } from "@/lib/master-data"
import type { Employee } from "@/lib/types"

const CSV_COLUMNS = ["Name", "Department"]

export function EmployeeView({ values }: { values: FilterValues }) {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Employee | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Employee | null>(null)

  const departmentIds = React.useMemo(
    () =>
      values.department
        ? collectDescendantIds(store.departments, Number(values.department))
        : null,
    [store.departments, values.department]
  )

  const filtered = React.useMemo(
    () => filterEmployees(store.employees, values, { departmentIds }),
    [store.employees, values, departmentIds]
  )

  const fields: FilterField[] = [
    {
      type: "search",
      name: "q",
      label: "Search",
      placeholder: "Employee name",
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
      filtered.map((employee) => [
        employee.name,
        departmentPath(store.departments, employee.departmentId) ?? "",
      ])
    )
  }

  const importCsv = async (rows: string[][]) => {
    return store.importEmployees(rows)
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
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
                      {filtered.map((employee) => (
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
          </div>
        </StoreState>
      </div>

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
          if (!pendingDelete) return
          try {
            await store.deleteEmployee(pendingDelete.id)
          } catch (error) {
            return error instanceof Error ? error.message : "Delete failed."
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
