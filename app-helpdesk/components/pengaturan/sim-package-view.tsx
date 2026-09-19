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
import { filterSimPackages } from "@/lib/master-data"
import type { SimPackage } from "@/lib/types"

const FIELDS: FilterField[] = [
  {
    type: "search",
    name: "q",
    label: "Search",
    placeholder: "Package name",
  },
]

export function SimPackageView({ values }: { values: FilterValues }) {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: SimPackage | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] =
    React.useState<SimPackage | null>(null)

  const filtered = React.useMemo(
    () => filterSimPackages(store.simPackages, values),
    [store.simPackages, values]
  )

  const submit = async (name: string) => {
    const editing = dialog.item

    try {
      if (editing) await store.updateSimPackage(editing.id, name)
      else await store.createSimPackage(name)
    } catch (err) {
      return err instanceof Error ? err.message : "Save failed."
    }
    return null
  }

  const blockReason = (id: number) =>
    store.simCards.some((card) => card.packageId === id)
      ? "Package is still used by SIM cards."
      : null

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="SIM Package"
          description="Data packages available for SIM card inventory."
          actions={
            <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
              <Plus />
              Add Package
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
        title={dialog.item ? "Edit SIM Package" : "Add SIM Package"}
        description="Package name must be unique and is used by SIM card inventory."
        label="Package Name"
        placeholder="Business 50GB"
        initialValue={dialog.item?.name}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete ${pendingDelete?.name}?`}
        description="SIM package will be removed from master data. This action cannot be undone."
        onConfirm={async () => {
          if (!pendingDelete) return
          try {
            await store.deleteSimPackage(pendingDelete.id)
          } catch (error) {
            return error instanceof Error ? error.message : "Delete failed."
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
