"use client"

import * as React from "react"
import {
  ArrowRightLeft,
  Info,
  Pencil,
  Smartphone,
  StickyNote,
  Trash2,
} from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { departmentName } from "@/lib/departments"
import { formatDate } from "@/lib/format"
import { SIM_CARD_SECTION_LABEL, simCardSection } from "@/lib/sim-cards"
import type { SimCard } from "@/lib/types"
import { cn } from "@/lib/utils"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm break-words">{children}</div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col rounded-lg border bg-card", className)}>
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <Icon className="size-3.5 text-primary" />
        <h3 className="text-xs font-medium">{title}</h3>
      </header>
      <div className="flex-1 p-3">{children}</div>
    </section>
  )
}

export function SimCardPreviewDialog({
  card,
  canWrite,
  onClose,
  onEdit,
  onMove,
  onDelete,
}: {
  card: SimCard | null
  canWrite: boolean
  onClose: () => void
  onEdit: (card: SimCard) => void
  onMove: (card: SimCard) => void
  onDelete: (card: SimCard) => void
}) {
  const store = useDataStore()

  const employee =
    card === null || card.employeeId === null
      ? "—"
      : (store.employees.find((item) => item.id === card.employeeId)?.name ??
        "—")
  const department =
    card === null
      ? "—"
      : (departmentName(store.departments, card.departmentId) ?? "—")
  const packageName =
    card === null || card.packageId === null
      ? "—"
      : (store.simPackages.find((item) => item.id === card.packageId)?.name ??
        "—")
  const group = card === null ? "" : SIM_CARD_SECTION_LABEL[simCardSection(card)]

  return (
    <Dialog
      open={card !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden overflow-y-auto p-0 sm:max-w-2xl"
      >
        {card ? (
          <>
            <header className="flex items-start gap-3 border-b bg-muted/40 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Smartphone className="size-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <DialogTitle className="font-mono text-base leading-tight break-words">
                  {card.phoneNumber}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {group} • IT Asset Management
                </DialogDescription>
              </div>
            </header>

            <div className="flex flex-col gap-3 bg-muted/20 p-4">
              <Section icon={Info} title="SIM Card Information">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Employee">{employee}</Field>
                  <Field label="Package">{packageName}</Field>
                  <div className="sm:col-span-2">
                    <Field label="Department">
                      <span className="text-muted-foreground">
                        {department}
                      </span>
                    </Field>
                  </div>
                  <Field label="CLS Domestic">
                    <span className="text-muted-foreground">
                      {card.clsDomestic ?? "—"}
                    </span>
                  </Field>
                  <Field label="CLS Roaming">
                    <span className="text-muted-foreground">
                      {card.clsRoaming ?? "—"}
                    </span>
                  </Field>
                  <Field label="Created">{formatDate(card.createdAt)}</Field>
                  <Field label="Latest Update">
                    {formatDate(card.updatedAt)}
                  </Field>
                </div>
              </Section>

              <Section
                icon={StickyNote}
                title="Note"
                className="min-h-[190px]"
              >
                <p className="text-sm break-words text-muted-foreground">
                  {card.note ?? "—"}
                </p>
              </Section>
            </div>
          </>
        ) : null}

        <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t bg-muted/50 p-4">
          {card && canWrite ? (
            <>
              <Button variant="outline" onClick={() => onMove(card)}>
                <ArrowRightLeft />
                Move
              </Button>
              <Button onClick={() => onEdit(card)}>
                <Pencil />
                Edit SIM Card
              </Button>
              <Button variant="destructive" onClick={() => onDelete(card)}>
                <Trash2 />
                Delete
              </Button>
            </>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
