"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { CsvActions } from "@/components/csv-actions"
import { PageHeader } from "@/components/page-header"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { DepartmentTree } from "@/components/pengaturan/department-tree"
import { DepartmentDialog } from "@/components/pengaturan/dialogs/department-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { csvFileName, downloadCsv } from "@/lib/csv"
import {
  departmentSubtreeDepth,
  flattenDepartments,
  MAX_DEPARTMENT_LEVEL,
} from "@/lib/departments"
import type { DepartmentNode } from "@/lib/types"

const CSV_COLUMNS = ["Nama", "Parent"]

export function DepartmentView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: DepartmentNode | null
    parentId: number | null
  }>({ open: false, item: null, parentId: null })
  const [pendingDelete, setPendingDelete] =
    React.useState<DepartmentNode | null>(null)

  const submit = (name: string, parentId: number | null) => {
    const editing = dialog.item

    if (
      store.departments.some(
        (item) =>
          item.id !== editing?.id &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      return "Nama department sudah dipakai."
    }

    if (parentId !== null) {
      const parent = flattenDepartments(store.departments).find(
        (node) => node.id === parentId
      )
      if (!parent) return "Parent department tidak ditemukan."

      const depth = editing
        ? departmentSubtreeDepth(store.departments, editing.id)
        : 0

      if (parent.level + depth >= MAX_DEPARTMENT_LEVEL) {
        return `Maksimal ${MAX_DEPARTMENT_LEVEL} level department.`
      }
    }

    if (editing) store.updateDepartment(editing.id, name, parentId)
    else store.createDepartment(name, parentId)
    return null
  }

  const deleteBlockReason = (node: DepartmentNode) => {
    if (node.children.length > 0) return "Masih punya sub-department."
    if (store.employees.some((item) => item.departmentId === node.id)) {
      return "Masih dipakai oleh employee."
    }
    if (store.assets.some((item) => item.departmentId === node.id)) {
      return "Masih dipakai oleh aset."
    }
    if (store.simCards.some((item) => item.departmentId === node.id)) {
      return "Masih dipakai oleh SIM card."
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

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Department"
        description={`Struktur divisi bertingkat, maksimal ${MAX_DEPARTMENT_LEVEL} level.`}
        actions={
          <>
            <CsvActions
              columns={CSV_COLUMNS}
              onExport={exportCsv}
              fileHint="Kolom Parent boleh dikosongkan untuk department level 1."
              note="File harus punya baris header sesuai kolom di atas. Data master yang belum ada akan dibuat otomatis. Penulisan ke database belum aktif pada tahap UI ini."
            />
            <Button
              size="sm"
              onClick={() =>
                setDialog({ open: true, item: null, parentId: null })
              }
            >
              <Plus />
              Tambah Department
            </Button>
          </>
        }
      />

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
        title={`Hapus ${pendingDelete?.name}?`}
        description={`Department ${pendingDelete?.path ?? ""} akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={() => {
          if (pendingDelete) store.deleteDepartment(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
