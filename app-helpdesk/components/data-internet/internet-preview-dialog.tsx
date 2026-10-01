"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Pencil, Trash2, Wifi } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/format"
import { locationLabelById } from "@/lib/locations"
import type { InternetData } from "@/lib/types"

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

export function InternetPreviewDialog({
  item,
  canWrite,
  position,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  onEdit,
  onDelete,
}: {
  item: InternetData | null
  canWrite: boolean
  position: string
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  onEdit: (item: InternetData) => void
  onDelete: (item: InternetData) => void
}) {
  const store = useDataStore()

  const location =
    item === null ? "—" : locationLabelById(store.locations, item.locationId)

  React.useEffect(() => {
    if (!item) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && hasPrev) {
        event.preventDefault()
        onPrev()
      } else if (event.key === "ArrowRight" && hasNext) {
        event.preventDefault()
        onNext()
      }
    }
    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [item, hasPrev, hasNext, onPrev, onNext])

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        {item ? (
          <>
            <header className="flex shrink-0 items-start gap-3 border-b bg-muted/40 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wifi className="size-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <DialogTitle className="font-mono text-base leading-tight break-words">
                  {item.internetId}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {item.service} • IT Asset Management
                </DialogDescription>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Location">
                  <span className="text-muted-foreground">{location}</span>
                </Field>
                <Field label="Service">{item.service}</Field>
                <Field label="Bandwidth">
                  {item.bandwidthMbps === null
                    ? "—"
                    : `${item.bandwidthMbps} Mbps`}
                </Field>
                <Field label="Customer Name">{item.customerName}</Field>
                <Field label="Monthly Cost">
                  {formatCurrency(item.monthlyCost)}
                </Field>
                <Field label="Payment Method">
                  <span className="text-muted-foreground">
                    {item.paymentMethod ?? "—"}
                  </span>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Detail">
                    <span className="text-muted-foreground">
                      {item.detail ?? "—"}
                    </span>
                  </Field>
                </div>
                <Field label="Created">{formatDate(item.createdAt)}</Field>
                <Field label="Latest Update">
                  {formatDate(item.updatedAt)}
                </Field>
              </div>
            </div>
          </>
        ) : null}

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-xl border-t bg-muted/50 p-4">
          <div className="flex items-center gap-2 sm:mr-auto">
            <Button
              variant="outline"
              size="icon-lg"
              className="size-10"
              disabled={!hasPrev}
              aria-label="Previous internet record"
              title="Previous internet record (←)"
              onClick={onPrev}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              {position}
            </span>
            <Button
              variant="outline"
              size="icon-lg"
              className="size-10"
              disabled={!hasNext}
              aria-label="Next internet record"
              title="Next internet record (→)"
              onClick={onNext}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
          {item && canWrite ? (
            <>
              <Button onClick={() => onEdit(item)}>
                <Pencil />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => onDelete(item)}>
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
