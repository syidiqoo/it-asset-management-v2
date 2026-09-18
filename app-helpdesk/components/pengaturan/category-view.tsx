"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { PageHeader } from "@/components/page-header"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { NameDialog } from "@/components/pengaturan/dialogs/name-dialog"
import { EntityList } from "@/components/pengaturan/entity-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Category } from "@/lib/types"

export function CategoryView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Category | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Category | null>(null)

  const submit = (name: string) => {
    const editing = dialog.item

    if (
      store.categories.some(
        (item) =>
          item.id !== editing?.id &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      return "Nama kategori sudah dipakai."
    }

    if (editing) store.updateCategory(editing.id, name)
    else store.createCategory(name)
    return null
  }

  const blockReason = (id: number) =>
    store.assets.some((asset) => asset.categoryId === id)
      ? "Kategori masih dipakai oleh aset."
      : null

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Kategori"
        description="Kategori inventaris aset, misalnya Laptop, Phone, PC, atau Printer."
        actions={
          <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
            <Plus />
            Tambah Kategori
          </Button>
        }
      />

      <Card size="sm" className="py-0">
        <CardContent className="px-0">
          <EntityList
            items={store.categories}
            blockReason={blockReason}
            onEdit={(item) => setDialog({ open: true, item })}
            onDelete={setPendingDelete}
          />
        </CardContent>
      </Card>

      <NameDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((previous) => ({ ...previous, open }))
        }
        title={dialog.item ? "Edit Kategori" : "Tambah Kategori"}
        description="Nama kategori harus unik dan dipakai oleh semua aset."
        label="Nama Kategori"
        placeholder="Laptop"
        initialValue={dialog.item?.name}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Hapus ${pendingDelete?.name}?`}
        description="Kategori akan dihapus dari master data. Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          if (pendingDelete) store.deleteCategory(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
