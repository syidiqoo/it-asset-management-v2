"use client"

import * as React from "react"
import { Inbox, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { CsvActions } from "@/components/csv-actions"
import { InternetDialog } from "@/components/data-internet/internet-dialog"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { Pagination } from "@/components/pagination"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { useSessionUser } from "@/components/use-session-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { csvFileName, downloadCsv } from "@/lib/csv"
import { buildFilterQuery, type FilterField, type FilterValues } from "@/lib/filters"
import { formatCurrency } from "@/lib/format"
import {
  filterInternetData,
  INTERNET_PAGE_SIZE,
} from "@/lib/internet"
import { formatLocationLabel, locationLabelById } from "@/lib/locations"
import type { InternetData, InternetDataInput } from "@/lib/types"

const CSV_COLUMNS = [
  "Location",
  "Detail",
  "Internet ID",
  "Service",
  "Bandwidth (Mbps)",
  "Customer Name",
  "Monthly Cost",
  "Payment Method",
]

export function DataInternetView({
  values,
  page: requestedPage,
}: {
  values: FilterValues
  page: number
}) {
  const store = useDataStore()
  const sessionUser = useSessionUser()
  const canWrite = sessionUser?.role === "admin"
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<InternetData | null>(null)
  const [target, setTarget] = React.useState<InternetData | null>(null)

  const locationLabel = React.useCallback(
    (id: number | null) => locationLabelById(store.locations, id),
    [store.locations]
  )

  const locationName = React.useCallback(
    (id: number | null) => {
      if (id === null) return ""
      const location = store.locations.find((item) => item.id === id)
      return location?.address?.trim() || location?.code || ""
    },
    [store.locations]
  )

  const filtered = React.useMemo(
    () => filterInternetData(store.internetData, values, { locationLabel }),
    [store.internetData, values, locationLabel]
  )

  const serviceOptions = React.useMemo(
    () =>
      [...new Set(store.internetData.map((item) => item.service))]
        .sort((a, b) => a.localeCompare(b, "id"))
        .map((service) => ({ label: service, value: service })),
    [store.internetData]
  )

  const fields: FilterField[] = [
    {
      type: "search",
      name: "q",
      label: "Search",
      placeholder: "Internet ID, customer, service",
    },
    {
      type: "select",
      name: "location",
      label: "Location",
      allLabel: "All locations",
      options: store.locations.map((location) => ({
        label: formatLocationLabel(location),
        value: String(location.id),
      })),
    },
    {
      type: "select",
      name: "service",
      label: "Service",
      allLabel: "All services",
      options: serviceOptions,
    },
  ]

  const pageCount = Math.max(1, Math.ceil(filtered.length / INTERNET_PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount)
  const pageItems = filtered.slice(
    (page - 1) * INTERNET_PAGE_SIZE,
    page * INTERNET_PAGE_SIZE
  )

  const buildHref = (target: number) => {
    const query = buildFilterQuery(values, target)
    return query ? `/data-internet?${query}` : "/data-internet"
  }

  const submit = async (input: InternetDataInput) => {
    const editingItem = editing

    try {
      if (editingItem) await store.updateInternetData(editingItem.id, input)
      else await store.createInternetData(input)
    } catch (err) {
      return err instanceof Error ? err.message : "Save failed."
    }
    return null
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (item: InternetData) => {
    setEditing(item)
    setDialogOpen(true)
  }

  const exportCsv = () => {
    downloadCsv(
      csvFileName("internet-data"),
      CSV_COLUMNS,
      filtered.map((item) => [
        locationName(item.locationId),
        item.detail ?? "",
        item.internetId,
        item.service,
        item.bandwidthMbps === null ? "" : String(item.bandwidthMbps),
        item.customerName,
        String(item.monthlyCost),
        item.paymentMethod ?? "",
      ])
    )
  }

  const importCsv = async (rows: string[][]) => {
    return store.importInternetData(rows)
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Internet Data"
          description="Internet subscriptions per location with bandwidth and monthly costs."
          actions={
            canWrite ? (
              <>
                <CsvActions
                  columns={CSV_COLUMNS}
                  onExport={exportCsv}
                  fileHint="Columns: Location, Detail, Internet ID, Service, Bandwidth, Customer Name, Monthly Cost, Payment Method."
                  note="Import is all-or-nothing: one bad row cancels the whole process. Rows whose Internet ID already exists are skipped. Location must already exist in Location master — unmatched ones are saved without a location."
                  onImport={importCsv}
                />
                <Button size="sm" onClick={openCreate}>
                  <Plus />
                  Add Internet Data
                </Button>
              </>
            ) : null
          }
        />
        <FilterBar fields={fields} values={values} />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <StoreState
          loading={store.loading}
          error={store.error}
          onRetry={store.refresh}
          empty={false}
        >
          <div className="contents">
        {pageItems.length === 0 ? (
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  No internet data found
                </p>
                <p className="text-sm text-muted-foreground">
                  Change keywords or reset filters to see other data.
                </p>
              </div>
              {canWrite ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus />
                  Add Internet Data
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card size="sm" className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Internet ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Bandwidth</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Monthly Cost</TableHead>
                    <TableHead className={canWrite ? undefined : "pr-4"}>
                      Payment Method
                    </TableHead>
                    {canWrite ? (
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">
                        {item.internetId}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {locationLabel(item.locationId)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.detail ?? "—"}
                      </TableCell>
                      <TableCell>{item.service}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.bandwidthMbps === null
                          ? "—"
                          : `${item.bandwidthMbps} Mbps`}
                      </TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(item.monthlyCost)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.paymentMethod ?? "—"}
                      </TableCell>
                      {canWrite ? (
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${item.internetId}`}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setTarget(item)}
                            >
                              <Trash2 />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {filtered.length > 0 ? (
          <Pagination
            page={page}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={INTERNET_PAGE_SIZE}
            unit="internet records"
            buildHref={buildHref}
          />
        ) : null}
          </div>
        </StoreState>
      </div>

      <InternetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSubmit={submit}
      />

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this internet record?</DialogTitle>
            <DialogDescription>
              Data{" "}
              <span className="font-medium text-foreground">
                {target?.internetId}
              </span>{" "}
              for {target?.customerName} will be deleted. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (target) {
                  try {
                    await store.deleteInternetData(target.id)
                  } catch {
                    return
                  }
                }
                setTarget(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
