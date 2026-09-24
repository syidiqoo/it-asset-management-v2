"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { CsvActions } from "@/components/csv-actions"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { SimCardSection } from "@/components/sim-cards/sim-card-section"
import { MoveSimCardDialog } from "@/components/sim-cards/move-sim-card-dialog"
import { SimCardFormDialog } from "@/components/sim-cards/sim-card-dialog"
import { SimCardPreviewDialog } from "@/components/sim-cards/sim-card-preview-dialog"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { useSessionUser } from "@/components/use-session-user"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { collectDescendantIds, departmentPath, flattenDepartments } from "@/lib/departments"
import { csvFileName, downloadCsv } from "@/lib/csv"
import { type FilterField, type FilterValues } from "@/lib/filters"
import {
  SIM_CARD_SECTION_LABEL,
  filterSimCards,
  simCardSection,
} from "@/lib/sim-cards"
import type { SimCard } from "@/lib/types"
import type { PdfColumn } from "@/lib/report"

const CSV_COLUMNS = [
  "Phone Number",
  "Employee",
  "Department",
  "Package",
  "CLS Domestic",
  "CLS Roaming",
]

export function SimCardsView({ values }: { values: FilterValues }) {
  const store = useDataStore()
  const sessionUser = useSessionUser()
  const canWrite = sessionUser?.role === "admin"
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SimCard | null>(null)
  const [preview, setPreview] = React.useState<SimCard | null>(null)
  const [moveTarget, setMoveTarget] = React.useState<SimCard | null>(null)
  const [target, setTarget] = React.useState<SimCard | null>(null)

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
        card.note ?? "",
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
      label: "Search",
      placeholder: "Phone number, employee, package",
    },
    {
      type: "select",
      name: "employee",
      label: "Employee",
      allLabel: "All employees",
      options: store.employees.map((employee) => ({
        label: employee.name,
        value: String(employee.id),
      })),
    },
    {
      type: "select",
      name: "department",
      label: "Department",
      allLabel: "All departments",
      options: flattenDepartments(store.departments).map((department) => ({
        label: department.path,
        value: String(department.id),
      })),
    },
    {
      type: "select",
      name: "package",
      label: "Package",
      allLabel: "All packages",
      options: store.simPackages.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    },
  ]

  const groups = React.useMemo(() => {
    const main: SimCard[] = []
    const available: SimCard[] = []
    const terminated: SimCard[] = []

    for (const card of filtered) {
      const section = simCardSection(card)
      if (section === "main") main.push(card)
      else if (section === "available") available.push(card)
      else terminated.push(card)
    }

    return { main, available, terminated }
  }, [filtered])

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

  const importCsv = async (rows: string[][]) => {
    return store.importSimCards(rows)
  }

  const PDF_COLUMNS: PdfColumn[] = [
    { header: "Phone Number" },
    { header: "Employee" },
    { header: "Department" },
    { header: "Package" },
    { header: "CLS Domestic" },
    { header: "CLS Roaming" },
  ]

  const pdfRows = filtered.map((card) => [
    card.phoneNumber,
    card.employeeId === null
      ? ""
      : (store.employees.find((item) => item.id === card.employeeId)?.name ??
        ""),
    departmentPath(store.departments, card.departmentId) ?? "",
    card.packageId === null
      ? ""
      : (store.simPackages.find((item) => item.id === card.packageId)?.name ??
        ""),
    card.clsDomestic ?? "",
    card.clsRoaming ?? "",
  ])

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="SIM Card"
          description="SIM card inventory grouped by Main, Available, and Terminate."
          actions={
            canWrite ? (
              <>
                <CsvActions
                  columns={CSV_COLUMNS}
                  onExport={exportCsv}
                  fileHint="Columns: MSISDN, Name, Position - Department, Package — or the app columns above."
                  note="Import is all-or-nothing: one bad row cancels the whole process. Rows whose MSISDN already exists are skipped. Employee, Department, or Package that is not in master is left empty, so the card lands in Available."
                  onImport={importCsv}
                  pdf={{
                    title: "Laporan SIM Card",
                    columns: PDF_COLUMNS,
                    rows: pdfRows,
                    filePrefix: "sim-card",
                  }}
                />
                <Button size="sm" onClick={openCreate}>
                  <Plus />
                  Add SIM Card
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
            <SimCardSection
              title={SIM_CARD_SECTION_LABEL.main}
              description="SIM cards currently held by an employee."
              cards={groups.main}
              onPreview={setPreview}
            />

            <SimCardSection
              title={SIM_CARD_SECTION_LABEL.available}
              description="Unassigned SIM cards ready to be handed out."
              cards={groups.available}
              onPreview={setPreview}
              defaultOpen={false}
            />

            <SimCardSection
              title={SIM_CARD_SECTION_LABEL.terminated}
              description="SIM cards whose number has been terminated."
              cards={groups.terminated}
              onPreview={setPreview}
              defaultOpen={false}
            />
          </div>
        </StoreState>
      </div>

      <SimCardPreviewDialog
        card={preview}
        canWrite={canWrite}
        onClose={() => setPreview(null)}
        onEdit={(card) => {
          setPreview(null)
          openEdit(card)
        }}
        onMove={(card) => {
          setPreview(null)
          setMoveTarget(card)
        }}
        onDelete={(card) => {
          setPreview(null)
          setTarget(card)
        }}
      />

      <SimCardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={editing}
      />

      <MoveSimCardDialog
        card={moveTarget}
        onClose={() => setMoveTarget(null)}
      />

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this SIM card?</DialogTitle>
            <DialogDescription>
              Number{" "}
              <span className="font-medium text-foreground">
                {target?.phoneNumber}
              </span>{" "}
              will be removed from inventory. This action cannot be undone.
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
                    await store.deleteSimCard(target.id)
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
