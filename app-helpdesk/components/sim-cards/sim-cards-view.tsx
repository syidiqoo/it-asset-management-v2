"use client"

import * as React from "react"
import { Inbox, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { CsvActions } from "@/components/csv-actions"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { Pagination } from "@/components/pagination"
import { SimCardFormDialog } from "@/components/sim-cards/sim-card-dialog"
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
import { collectDescendantIds, departmentPath, flattenDepartments } from "@/lib/departments"
import { csvFileName, downloadCsv } from "@/lib/csv"
import { buildFilterQuery, type FilterField, type FilterValues } from "@/lib/filters"
import { filterSimCards, SIM_CARD_PAGE_SIZE } from "@/lib/sim-cards"
import type { SimCard } from "@/lib/types"

const CSV_COLUMNS = [
  "No Handphone",
  "Employee",
  "Department",
  "Package",
  "CLS Domestic",
  "CLS Roaming",
]

export function SimCardsView({
  values,
  page: requestedPage,
}: {
  values: FilterValues
  page: number
}) {
  const store = useDataStore()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SimCard | null>(null)
  const [target, setTarget] = React.useState<SimCard | null>(null)

  const employeeName = (id: number | null) =>
    id === null
      ? "—"
      : (store.employees.find((employee) => employee.id === id)?.name ?? "—")

  const packageName = (id: number | null) =>
    id === null
      ? "—"
      : (store.simPackages.find((item) => item.id === id)?.name ?? "—")

  const departmentName = (id: number | null) =>
    departmentPath(store.departments, id) ?? "—"

  const departmentIds = React.useMemo(
    () =>
      values.department
        ? collectDescendantIds(store.departments, Number(values.department))
        : null,
    [store.departments, values.department]
  )

  const searchText = React.useCallback(
    (card: SimCard) =>
      [
        card.phoneNumber,
        card.employeeId === null
          ? ""
          : (store.employees.find((item) => item.id === card.employeeId)?.name ??
            ""),
        departmentPath(store.departments, card.departmentId) ?? "",
        card.packageId === null
          ? ""
          : (store.simPackages.find((item) => item.id === card.packageId)
              ?.name ?? ""),
        card.clsDomestic ?? "",
        card.clsRoaming ?? "",
      ].join(" "),
    [store.employees, store.departments, store.simPackages]
  )

  const filtered = React.useMemo(
    () => filterSimCards(store.simCards, values, { departmentIds, searchText }),
    [store.simCards, values, departmentIds, searchText]
  )

  const fields: FilterField[] = [
    {
      type: "search",
      name: "q",
      label: "Pencarian",
      placeholder: "No handphone, employee, package",
    },
    {
      type: "select",
      name: "employee",
      label: "Employee",
      allLabel: "Semua employee",
      options: store.employees.map((employee) => ({
        label: employee.name,
        value: String(employee.id),
      })),
    },
    {
      type: "select",
      name: "department",
      label: "Department",
      allLabel: "Semua department",
      options: flattenDepartments(store.departments).map((department) => ({
        label: department.path,
        value: String(department.id),
      })),
    },
    {
      type: "select",
      name: "package",
      label: "Package",
      allLabel: "Semua package",
      options: store.simPackages.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    },
  ]

  const pageCount = Math.max(1, Math.ceil(filtered.length / SIM_CARD_PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount)
  const pageItems = filtered.slice(
    (page - 1) * SIM_CARD_PAGE_SIZE,
    page * SIM_CARD_PAGE_SIZE
  )

  const buildHref = (target: number) => {
    const query = buildFilterQuery(values, target)
    return query ? `/sim-cards?${query}` : "/sim-cards"
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (card: SimCard) => {
    setEditing(card)
    setDialogOpen(true)
  }

  const exportCsv = () => {
    downloadCsv(
      csvFileName("sim-card"),
      CSV_COLUMNS,
      filtered.map((card) => [
        card.phoneNumber,
        card.employeeId === null
          ? ""
          : (store.employees.find((item) => item.id === card.employeeId)?.name ??
            ""),
        departmentPath(store.departments, card.departmentId) ?? "",
        card.packageId === null
          ? ""
          : (store.simPackages.find((item) => item.id === card.packageId)
              ?.name ?? ""),
        card.clsDomestic ?? "",
        card.clsRoaming ?? "",
      ])
    )
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="SIM Card"
          description="Inventaris kartu SIM beserta pemegang, paket, dan layanan roaming."
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
                Tambah SIM Card
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
                <p className="text-sm font-medium">Tidak ada SIM card ditemukan</p>
                <p className="text-sm text-muted-foreground">
                  Ubah kata kunci atau reset filter untuk melihat data lainnya.
                </p>
              </div>
              <Button size="sm" onClick={openCreate}>
                <Plus />
                Tambah SIM Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card size="sm" className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">No Handphone</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>CLS Domestic</TableHead>
                    <TableHead>CLS Roaming</TableHead>
                    <TableHead className="pr-4 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">
                        {card.phoneNumber}
                      </TableCell>
                      <TableCell>{employeeName(card.employeeId)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {departmentName(card.departmentId)}
                      </TableCell>
                      <TableCell>{packageName(card.packageId)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {card.clsDomestic ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {card.clsRoaming ?? "—"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Aksi untuk ${card.phoneNumber}`}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEdit(card)}>
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setTarget(card)}
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
            pageSize={SIM_CARD_PAGE_SIZE}
            unit="SIM card"
            buildHref={buildHref}
          />
        ) : null}
      </div>

      <SimCardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={editing}
      />

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus SIM card ini?</DialogTitle>
            <DialogDescription>
              Nomor{" "}
              <span className="font-medium text-foreground">
                {target?.phoneNumber}
              </span>{" "}
              akan dihapus dari inventaris. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (target) store.deleteSimCard(target.id)
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
