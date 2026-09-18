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
import type { SimPackage } from "@/lib/types"

export function SimPackageView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: SimPackage | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] =
    React.useState<SimPackage | null>(null)

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
    <div className="flex flex-col gap-4 p-4 md:p-6">
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

      <StoreState
        loading={store.loading}
        error={store.error}
        onRetry={store.refresh}
        empty={false}
      >
      <Card size="sm" className="py-0">
        <CardContent className="px-0">
          <EntityList
            items={store.simPackages}
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
          if (pendingDelete) {
            try {
              await store.deleteSimPackage(pendingDelete.id)
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
