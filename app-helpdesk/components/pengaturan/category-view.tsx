"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { NameDialog } from "@/components/pengaturan/dialogs/name-dialog"
import { EntityList } from "@/components/pengaturan/entity-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { hasActiveFilters, type FilterField, type FilterValues } from "@/lib/filters"
import { filterCategories } from "@/lib/master-data"
import type { Category } from "@/lib/types"

const FIELDS: FilterField[] = [
  {
    type: "search",
    name: "q",
    label: "Search",
    placeholder: "Category name",
  },
]

export function CategoryView({ values }: { values: FilterValues }) {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Category | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Category | null>(null)

  const filtered = React.useMemo(
    () => filterCategories(store.categories, values),
    [store.categories, values]
  )

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
    <div className="flex flex-col">
      <StickyHeader>
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
        <FilterBar fields={FIELDS} values={values} />
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
                <EntityList
                  items={filtered}
                  emptyLabel={
                    hasActiveFilters(values)
                      ? "No results found. Change keywords or reset filters."
                      : "No data yet."
                  }
                  blockReason={blockReason}
                  onEdit={(item) => setDialog({ open: true, item })}
                  onDelete={setPendingDelete}
                />
              </CardContent>
            </Card>
          </div>
        </StoreState>
      </div>

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
          if (!pendingDelete) return
          try {
            await store.deleteCategory(pendingDelete.id)
          } catch (error) {
            return error instanceof Error ? error.message : "Delete failed."
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
