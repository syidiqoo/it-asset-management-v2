"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { StoreState } from "@/components/store-state"
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

const CSV_COLUMNS = ["Code", "Full Address", "Latitude", "Longitude"]

export function LocationView() {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Location | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Location | null>(null)

  const submit = async (input: LocationInput) => {
    const editing = dialog.item

    try {
      if (editing) await store.updateLocation(editing.id, input)
      else await store.createLocation(input)
    } catch (err) {
      return err instanceof Error ? err.message : "Save failed."
    }
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
        description={`Asset locations with codes 001–${LOCATION_CODE_MAX}, full addresses, and coordinates.`}
        actions={
          <>
            <CsvActions
              columns={CSV_COLUMNS}
              onExport={exportCsv}
              fileHint="Coordinates may be left empty."
              note="File must have a header row matching the columns above. Missing master data will be created automatically. Database writes are not yet enabled at this UI stage."
            />
            <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
              <Plus />
              Add Location
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
          {store.locations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No data yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Code</TableHead>
                  <TableHead>Full Address</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
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
      </StoreState>

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
        title={`Delete location ${pendingDelete?.code}?`}
        description="Location will be removed from master data. This action cannot be undone."
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await store.deleteLocation(pendingDelete.id)
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
