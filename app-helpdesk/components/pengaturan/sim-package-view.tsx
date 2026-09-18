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
import type { SimPackage } from "@/lib/types"

export function SimPackageView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: SimPackage | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] =
    React.useState<SimPackage | null>(null)

  const submit = (name: string) => {
    const editing = dialog.item

    if (
      store.simPackages.some(
        (item) =>
          item.id !== editing?.id &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      return "Nama package sudah dipakai."
    }

    if (editing) store.updateSimPackage(editing.id, name)
    else store.createSimPackage(name)
    return null
  }

  const blockReason = (id: number) =>
    store.simCards.some((card) => card.packageId === id)
      ? "Package masih dipakai oleh SIM card."
      : null

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Package SIM"
        description="Paket data yang bisa dipilih pada inventaris SIM card."
        actions={
          <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
            <Plus />
            Tambah Package
          </Button>
        }
      />

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

      <NameDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((previous) => ({ ...previous, open }))
        }
        title={dialog.item ? "Edit Package SIM" : "Tambah Package SIM"}
        description="Nama package harus unik dan dipakai oleh inventaris SIM card."
        label="Nama Package"
        placeholder="Business 50GB"
        initialValue={dialog.item?.name}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Hapus ${pendingDelete?.name}?`}
        description="Package SIM akan dihapus dari master data. Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          if (pendingDelete) store.deleteSimPackage(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
