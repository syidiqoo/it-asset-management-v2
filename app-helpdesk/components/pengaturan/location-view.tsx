"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { CsvActions } from "@/components/csv-actions"
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
import {
  hasActiveFilters,
  type FilterField,
  type FilterValues,
} from "@/lib/filters"
import { formatCoordinates, LOCATION_CODE_MAX } from "@/lib/locations"
import { filterLocations } from "@/lib/master-data"
import type { Location, LocationInput } from "@/lib/types"

const CSV_COLUMNS = [
  "Code",
  "Address",
  "Detail Street Address",
  "Latitude",
  "Longitude",
]

const FIELDS: FilterField[] = [
  {
    type: "search",
    name: "q",
    label: "Search",
    placeholder: "Code, address, detail",
  },
  {
    type: "select",
    name: "coordinates",
    label: "Coordinates",
    allLabel: "All locations",
    options: [
      { label: "With coordinates", value: "with" },
      { label: "Without coordinates", value: "without" },
    ],
  },
]

export function LocationView({ values }: { values: FilterValues }) {
  const store = useDataStore()
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: Location | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<Location | null>(null)

  const filtered = React.useMemo(
    () => filterLocations(store.locations, values),
    [store.locations, values]
  )

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

  const deleteBlockReason = (id: number) =>
    store.internetData.some((item) => item.locationId === id)
      ? "Location is still used by internet data."
      : null

  const exportCsv = () => {
    downloadCsv(
      csvFileName("location"),
      CSV_COLUMNS,
      [...filtered]
        .sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true }))
        .map((location) => [
          location.code,
          location.address ?? "",
          location.detailStreetAddress,
          location.latitude === null ? "" : String(location.latitude),
          location.longitude === null ? "" : String(location.longitude),
        ])
    )
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Location"
          description={`Asset locations with codes 001–${LOCATION_CODE_MAX}, a short address, detailed street address, and coordinates.`}
          actions={
            <>
              <CsvActions
                columns={CSV_COLUMNS}
                onExport={exportCsv}
                fileHint="Coordinates may be left empty."
                note="Export includes every location. Import is not available for locations yet."
              />
              <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
                <Plus />
                Add Location
              </Button>
            </>
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
                {filtered.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {hasActiveFilters(values)
                      ? "No results found. Change keywords or reset filters."
                      : "No data yet."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Code</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Detail Street Address</TableHead>
                        <TableHead>Coordinates</TableHead>
                        <TableHead className="pr-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell className="pl-4">
                            <Badge variant="outline" className="font-mono">
                              {location.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {location.address ?? "—"}
                          </TableCell>
                          <TableCell className="whitespace-normal! text-muted-foreground">
                            {location.detailStreetAddress}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {formatCoordinates(location)}
                          </TableCell>
                          <TableCell className="pr-4">
                            <ItemActions
                              label={location.code}
                              blockReason={deleteBlockReason(location.id)}
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
          </div>
        </StoreState>
      </div>

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
          if (!pendingDelete) return
          try {
            await store.deleteLocation(pendingDelete.id)
          } catch (error) {
            return error instanceof Error ? error.message : "Delete failed."
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
