"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { CsvActions } from "@/components/csv-actions"
import { PageHeader } from "@/components/page-header"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { LocationDialog } from "@/components/pengaturan/dialogs/location-dialog"
import { ItemActions } from "@/components/pengaturan/item-actions"
import { Badge } from "@/components/ui/badge"
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
import { formatCoordinates, LOCATION_CODE_MAX } from "@/lib/locations"
import type { Location, LocationInput } from "@/lib/types"

const CSV_COLUMNS = ["Kode", "Alamat Lengkap", "Latitude", "Longitude"]

export function LocationView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Location | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Location | null>(null)

  const submit = (input: LocationInput) => {
    const editing = dialog.item

    if (
      store.locations.some(
        (item) => item.id !== editing?.id && item.code === input.code
      )
    ) {
      return `Kode ${input.code} sudah dipakai location lain.`
    }

    if (editing) store.updateLocation(editing.id, input)
    else store.createLocation(input)
    return null
  }

  const exportCsv = () => {
    downloadCsv(
      csvFileName("location"),
      CSV_COLUMNS,
      [...store.locations]
        .sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true }))
        .map((location) => [
          location.code,
          location.address,
          location.latitude === null ? "" : String(location.latitude),
          location.longitude === null ? "" : String(location.longitude),
        ])
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Location"
        description={`Lokasi aset dengan kode 001–${LOCATION_CODE_MAX}, alamat lengkap, dan titik koordinat.`}
        actions={
          <>
            <CsvActions
              columns={CSV_COLUMNS}
              onExport={exportCsv}
              fileHint="Koordinat boleh dikosongkan."
              note="File harus punya baris header sesuai kolom di atas. Data master yang belum ada akan dibuat otomatis. Penulisan ke database belum aktif pada tahap UI ini."
            />
            <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
              <Plus />
              Tambah Location
            </Button>
          </>
        }
      />

      <Card size="sm" className="py-0">
        <CardContent className="px-0">
          {store.locations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Belum ada data.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Kode</TableHead>
                  <TableHead>Alamat Lengkap</TableHead>
                  <TableHead>Koordinat</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="pl-4">
                      <Badge variant="outline" className="font-mono">
                        {location.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal! text-muted-foreground">
                      {location.address}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatCoordinates(location)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <ItemActions
                        label={location.code}
                        onEdit={() =>
                          setDialog({ open: true, item: location })
                        }
                        onDelete={() => setPendingDelete(location)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LocationDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((previous) => ({ ...previous, open }))
        }
        location={dialog.item}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Hapus location ${pendingDelete?.code}?`}
        description="Location akan dihapus dari master data. Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          if (pendingDelete) store.deleteLocation(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
