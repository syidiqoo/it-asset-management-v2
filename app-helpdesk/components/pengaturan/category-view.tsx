"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { StoreState } from "@/components/store-state"
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

  const submit = async (name: string) => {
    const editing = dialog.item

    try {
      if (editing) await store.updateCategory(editing.id, name)
      else await store.createCategory(name)
    } catch (err) {
      return err instanceof Error ? err.message : "Save failed."
    }
    return null
  }

  const blockReason = (id: number) =>
    store.assets.some((asset) => asset.categoryId === id)
      ? "Category is still used by assets."
      : null

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Category"
        description="Asset inventory categories, e.g. Laptop, Phone, PC, or Printer."
        actions={
          <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
            <Plus />
            Add Category
          </Button>
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
          <EntityList
            items={store.categories}
            blockReason={blockReason}
            onEdit={(item) => setDialog({ open: true, item })}
            onDelete={setPendingDelete}
          />
        </CardContent>
      </Card>
      </StoreState>

      <NameDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((previous) => ({ ...previous, open }))
        }
        title={dialog.item ? "Edit Category" : "Add Category"}
        description="Category name must be unique and is used by all assets."
        label="Category Name"
        placeholder="Laptop"
        initialValue={dialog.item?.name}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete ${pendingDelete?.name}?`}
        description="Category will be removed from master data. This action cannot be undone."
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await store.deleteCategory(pendingDelete.id)
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
