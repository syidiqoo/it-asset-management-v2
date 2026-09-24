"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRightLeft,
  FileText,
  History,
  ImageIcon,
  Info,
  Laptop,
  Pencil,
  StickyNote,
  Trash2,
} from "lucide-react"

import {
  AssetHistoryDialog,
  type AssetHistoryItem,
} from "@/components/assets/asset-history-dialog"
import { DocumentPreviewDialog } from "@/components/assets/document-preview-dialog"
import { useDataStore } from "@/components/data-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { fetchAssetFileHistory } from "@/lib/asset-history"
import { departmentName } from "@/lib/departments"
import { CONDITION_BADGE_CLASS, formatDate } from "@/lib/format"
import type { Asset, AssetFileHistory, AssetInput } from "@/lib/types"
import { cn } from "@/lib/utils"

function toAssetInput(asset: Asset): AssetInput {
  return {
    categoryId: asset.categoryId,
    name: asset.name,
    code: asset.code,
    serialNumber: asset.serialNumber,
    employeeId: asset.employeeId,
    departmentId: asset.departmentId,
    condition: asset.condition,
    imageUrl: asset.imageUrl,
    docUrl: asset.docUrl,
    recordDate: asset.recordDate,
    purchaseDate: asset.purchaseDate,
    note: asset.note,
  }
}

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
    <section
      className={cn(
        "flex flex-col rounded-lg border bg-card",
        className
      )}
    >
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <Icon className="size-3.5 text-primary" />
        <h3 className="text-xs font-medium">{title}</h3>
      </header>
      <div className="flex-1 p-3">{children}</div>
    </section>
  )
}

function AssetImage({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = React.useState(false)

  if (!url || failed) {
    return (
      <>
        <ImageIcon className="size-8 text-muted-foreground" />
        <p className="px-4 text-xs text-muted-foreground">
          {url ? "Image could not be loaded." : "No image uploaded."}
        </p>
      </>
    )
  }

  return (
    <img
      src={url}
      alt={name}
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

export function AssetPreviewDialog({
  asset,
  canWrite,
  onClose,
  onDelete,
  onMove,
}: {
  asset: Asset | null
  canWrite: boolean
  onClose: () => void
  onDelete: (asset: Asset) => void
  onMove: (asset: Asset) => void
}) {
  const store = useDataStore()
  const [document, setDocument] = React.useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [historyState, setHistoryState] = React.useState<{
    key: string
    data: AssetFileHistory
  } | null>(null)
  const [restoring, setRestoring] = React.useState<string | null>(null)
  const [restoreError, setRestoreError] = React.useState<string | null>(null)

  const category =
    asset === null
      ? "—"
      : (store.categories.find((item) => item.id === asset.categoryId)?.name ??
        "—")
  const employee =
    asset === null || asset.employeeId === null
      ? "—"
      : (store.employees.find((item) => item.id === asset.employeeId)?.name ??
        "—")
  const department =
    asset === null
      ? "—"
      : (departmentName(store.departments, asset.departmentId) ?? "—")

  const historyKey = asset ? `${asset.id}:${asset.updatedAt}` : null
  const history =
    historyState && historyKey && historyState.key === historyKey
      ? historyState.data
      : null

  React.useEffect(() => {
    if (!asset || !historyKey) return
    let cancelled = false
    fetchAssetFileHistory(asset.id)
      .then((data) => {
        if (!cancelled) setHistoryState({ key: historyKey, data })
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryState({
            key: historyKey,
            data: { image: [], document: [] },
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [asset, historyKey])

  const imageItems = React.useMemo(() => {
    if (!asset) return []
    const items: AssetHistoryItem[] = []
    if (asset.imageUrl) {
      items.push({ url: asset.imageUrl, label: "Saat ini", current: true })
    }
    for (const entry of history?.image ?? []) {
      if (entry.url !== asset.imageUrl) {
        items.push({
          url: entry.url,
          label: formatDate(entry.createdAt),
          current: false,
        })
      }
    }
    return items
  }, [asset, history])

  const documentItems = React.useMemo(() => {
    if (!asset) return []
    const items: AssetHistoryItem[] = []
    if (asset.docUrl) {
      items.push({ url: asset.docUrl, label: "Dokumen saat ini", current: true })
    }
    for (const entry of history?.document ?? []) {
      if (entry.url !== asset.docUrl) {
        items.push({
          url: entry.url,
          label: entry.fileName ?? formatDate(entry.createdAt),
          current: false,
        })
      }
    }
    return items
  }, [asset, history])

  const hasHistory = imageItems.length > 1 || documentItems.length > 1

  const restore = async (kind: "image" | "document", url: string) => {
    if (!asset) return
    setRestoring(url)
    setRestoreError(null)
    try {
      const input = toAssetInput(asset)
      if (kind === "image") {
        input.imageUrl = url
      } else {
        input.docUrl = url
      }
      await store.updateAsset(asset.id, input)
    } catch (error) {
      setRestoreError(
        error instanceof Error ? error.message : "Gagal mengembalikan file."
      )
    } finally {
      setRestoring(null)
    }
  }

  return (
    <Dialog
      open={asset !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden overflow-y-auto p-0 sm:max-w-4xl"
      >
        {asset ? (
          <>
            <header className="flex items-start gap-3 border-b bg-muted/40 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Laptop className="size-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <DialogTitle className="text-base leading-tight break-words">
                  {asset.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {category} • IT Asset Management
                </DialogDescription>
              </div>

              {hasHistory ? (
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="relative shrink-0"
                  aria-label="Lihat riwayat file"
                  title="Riwayat foto & dokumen (5 versi terakhir)"
                  onClick={() => {
                    setRestoreError(null)
                    setHistoryOpen(true)
                  }}
                >
                  <History className="size-5" />
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                    {imageItems.length + documentItems.length}
                  </span>
                </Button>
              ) : null}

              {asset.docUrl ? (
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="shrink-0"
                  aria-label="View asset document (PDF)"
                  title="View asset document (PDF)"
                  onClick={() => setDocument(asset.docUrl)}
                >
                  <FileText className="size-5" />
                </Button>
              ) : null}
            </header>

            <div className="grid gap-4 bg-muted/20 p-4 md:grid-cols-[300px_1fr]">
              <div className="flex min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-lg border bg-muted/40 text-center">
                <AssetImage
                  key={asset.id}
                  url={asset.imageUrl}
                  name={asset.name}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Section icon={Info} title="Asset Information">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Code">
                      <span className="font-mono text-xs">{asset.code}</span>
                    </Field>
                    <Field label="Condition">
                      <Badge
                        variant="outline"
                        className={cn(CONDITION_BADGE_CLASS[asset.condition])}
                      >
                        {asset.condition}
                      </Badge>
                    </Field>
                    <Field label="Serial Number">
                      <span className="text-muted-foreground">
                        {asset.serialNumber ?? "—"}
                      </span>
                    </Field>
                    <Field label="Employee">{employee}</Field>
                    <div className="sm:col-span-2">
                      <Field label="Department">
                        <span className="text-muted-foreground">
                          {department}
                        </span>
                      </Field>
                    </div>
                    <Field label="Latest Update">
                      {formatDate(asset.updatedAt)}
                    </Field>
                    <Field label="Purchase Date">
                      {asset.purchaseDate ? formatDate(asset.purchaseDate) : "—"}
                    </Field>
                  </div>
                </Section>

                <Section
                  icon={StickyNote}
                  title="Note"
                  className="min-h-[190px] flex-1"
                >
                  <p className="text-sm break-words text-muted-foreground">
                    {asset.note ?? "—"}
                  </p>
                </Section>
              </div>
            </div>
          </>
        ) : null}

        <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t bg-muted/50 p-4">
          {asset && canWrite ? (
            <>
              <Button variant="outline" onClick={() => onMove(asset)}>
                <ArrowRightLeft />
                Move
              </Button>
              <Button render={<Link href={`/assets/${asset.id}/edit`} />}>
                <Pencil />
                Edit Asset
              </Button>
              <Button variant="destructive" onClick={() => onDelete(asset)}>
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

      <DocumentPreviewDialog
        url={document}
        title={asset?.name}
        onClose={() => setDocument(null)}
      />

      <AssetHistoryDialog
        asset={historyOpen ? asset : null}
        imageItems={imageItems}
        documentItems={documentItems}
        canWrite={canWrite}
        restoring={restoring}
        error={restoreError}
        onRestore={restore}
        onClose={() => setHistoryOpen(false)}
      />
    </Dialog>
  )
}
