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
  normalizeInternetId,
} from "@/lib/internet"
import { formatLocationLabel, locationLabelById } from "@/lib/locations"
import type { InternetData, InternetDataInput } from "@/lib/types"

const CSV_COLUMNS = [
  "ID Internet",
  "Lokasi",
  "Layanan",
  "Bandwidth (Mbps)",
  "Nama Pelanggan",
  "Biaya Bulanan",
]

export function DataInternetView({
  values,
  page: requestedPage,
}: {
  values: FilterValues
  page: number
}) {
  const store = useDataStore()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<InternetData | null>(null)
  const [target, setTarget] = React.useState<InternetData | null>(null)

  const locationLabel = React.useCallback(
    (id: number | null) => locationLabelById(store.locations, id),
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
      label: "Pencarian",
      placeholder: "ID internet, pelanggan, layanan",
    },
    {
      type: "select",
      name: "location",
      label: "Lokasi",
      allLabel: "Semua lokasi",
      options: store.locations.map((location) => ({
        label: formatLocationLabel(location),
        value: String(location.id),
      })),
    },
    {
      type: "select",
      name: "service",
      label: "Layanan",
      allLabel: "Semua layanan",
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

  const submit = (input: InternetDataInput) => {
    const editingItem = editing

    if (
      store.internetData.some(
        (item) =>
          item.id !== editingItem?.id &&
          normalizeInternetId(item.internetId) === input.internetId
      )
    ) {
      return "ID Internet sudah dipakai."
    }

    if (editingItem) store.updateInternetData(editingItem.id, input)
    else store.createInternetData(input)
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
      csvFileName("data-internet"),
      CSV_COLUMNS,
      filtered.map((item) => [
        item.internetId,
        locationLabel(item.locationId),
        item.service,
        String(item.bandwidthMbps),
        item.customerName,
        String(item.monthlyCost),
      ])
    )
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Data Internet"
          description="Langganan internet per lokasi beserta bandwidth dan biaya bulanannya."
          actions={
            <>
              <CsvActions
                columns={CSV_COLUMNS}
                onExport={exportCsv}
                fileHint="Format CSV, baris pertama adalah nama kolom."
                note="File harus punya baris header sesuai kolom di atas. Data master yang belum ada akan dibuat otomatis. Penulisan ke database belum aktif pada tahap UI ini."
              />
              <Button size="sm" onClick={openCreate}>
                <Plus />
                Tambah Data Internet
              </Button>
            </>
          }
        />
        <FilterBar fields={fields} values={values} />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        {pageItems.length === 0 ? (
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Tidak ada data internet ditemukan
                </p>
                <p className="text-sm text-muted-foreground">
                  Ubah kata kunci atau reset filter untuk melihat data lainnya.
                </p>
              </div>
              <Button size="sm" onClick={openCreate}>
                <Plus />
                Tambah Data Internet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card size="sm" className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">ID Internet</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead className="text-right">Bandwidth</TableHead>
                    <TableHead>Nama Pelanggan</TableHead>
                    <TableHead className="text-right">Biaya Bulanan</TableHead>
                    <TableHead className="pr-4 text-right">Aksi</TableHead>
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
                      <TableCell>{item.service}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.bandwidthMbps} Mbps
                      </TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(item.monthlyCost)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Aksi untuk ${item.internetId}`}
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
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
            unit="data internet"
            buildHref={buildHref}
          />
        ) : null}
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
            <DialogTitle>Hapus data internet ini?</DialogTitle>
            <DialogDescription>
              Data{" "}
              <span className="font-medium text-foreground">
                {target?.internetId}
              </span>{" "}
              milik {target?.customerName} akan dihapus. Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (target) store.deleteInternetData(target.id)
                setTarget(null)
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
