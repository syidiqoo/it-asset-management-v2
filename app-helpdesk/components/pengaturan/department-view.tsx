"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { StoreState } from "@/components/store-state"
import { CsvActions } from "@/components/csv-actions"
import { PageHeader } from "@/components/page-header"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { DepartmentTree } from "@/components/pengaturan/department-tree"
import { DepartmentDialog } from "@/components/pengaturan/dialogs/department-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { csvFileName, downloadCsv } from "@/lib/csv"
import {
  flattenDepartments,
  MAX_DEPARTMENT_LEVEL,
} from "@/lib/departments"
import type { DepartmentNode } from "@/lib/types"

const CSV_COLUMNS = ["Name", "Parent"]

export function DepartmentView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: DepartmentNode | null
    parentId: number | null
  }>({ open: false, item: null, parentId: null })
  const [pendingDelete, setPendingDelete] =
    React.useState<DepartmentNode | null>(null)

  const submit = async (name: string, parentId: number | null) => {
    const editing = dialog.item

    try {
      if (editing) await store.updateDepartment(editing.id, name, parentId)
      else await store.createDepartment(name, parentId)
    } catch (err) {
      return err instanceof Error ? err.message : "Save failed."
    }
    return null
  }

  const deleteBlockReason = (node: DepartmentNode) => {
    if (node.children.length > 0) return "Still has sub-departments."
    if (store.employees.some((item) => item.departmentId === node.id)) {
      return "Still used by employees."
    }
    if (store.assets.some((item) => item.departmentId === node.id)) {
      return "Still used by assets."
    }
    if (store.simCards.some((item) => item.departmentId === node.id)) {
      return "Still used by SIM cards."
    }
    return null
  }

  const exportCsv = () => {
    const nodes = flattenDepartments(store.departments)
    const pathById = new Map(nodes.map((node) => [node.id, node.path]))

    downloadCsv(
      csvFileName("department"),
      CSV_COLUMNS,
      nodes.map((node) => [
        node.name,
        node.parentId === null ? "" : (pathById.get(node.parentId) ?? ""),
      ])
    )
  }

  const importCsv = async (rows: string[][]) => {
    return store.importDepartments(rows)
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Department"
        description={`Nested division structure, maximum ${MAX_DEPARTMENT_LEVEL} levels.`}
        actions={
          <>
            <CsvActions
              columns={CSV_COLUMNS}
              onExport={exportCsv}
              fileHint="Columns: Name, Parent — or the sample format: ID, Nama, Induk."
              note="Import is all-or-nothing: one bad row cancels the whole process. Rows whose name already exists are skipped."
              onImport={importCsv}
            />
            <Button
              size="sm"
              onClick={() =>
                setDialog({ open: true, item: null, parentId: null })
              }
            >
              <Plus />
              Add Department
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
          <DepartmentTree
            departments={store.departments}
            deleteBlockReason={deleteBlockReason}
            onAddChild={(node) =>
              setDialog({ open: true, item: null, parentId: node.id })
            }
            onEdit={(node) =>
              setDialog({ open: true, item: node, parentId: null })
            }
            onDelete={setPendingDelete}
          />
        </CardContent>
      </Card>
      </StoreState>

      <DepartmentDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((previous) => ({ ...previous, open }))
        }
        department={dialog.item}
        departments={store.departments}
        defaultParentId={dialog.parentId}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete ${pendingDelete?.name}?`}
        description={`Department ${pendingDelete?.path ?? ""} will be deleted. This action cannot be undone.`}
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await store.deleteDepartment(pendingDelete.id)
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
