"use client"

import * as React from "react"
import { FileText, ImageIcon, RotateCcw } from "lucide-react"

import { DocumentPreviewDialog } from "@/components/assets/document-preview-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Asset } from "@/lib/types"
import { cn } from "@/lib/utils"

export type AssetHistoryItem = {
  url: string
  label: string
  current: boolean
}

export function AssetHistoryDialog({
  asset,
  imageItems,
  documentItems,
  canWrite,
  restoring,
  error,
  onRestore,
  onClose,
}: {
  asset: Asset | null
  imageItems: AssetHistoryItem[]
  documentItems: AssetHistoryItem[]
  canWrite: boolean
  restoring: string | null
  error: string | null
  onRestore: (kind: "image" | "document", url: string) => void
  onClose: () => void
}) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  const [document, setDocument] = React.useState<string | null>(null)

  if (!asset) return null

  const selected = imageItems.find((item) => item.url === selectedImage) ?? null

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Riwayat File</DialogTitle>
          <DialogDescription>
            {asset.name} — 5 versi terakhir yang tersimpan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium">
              <ImageIcon className="size-3.5 text-primary" />
              Foto ({imageItems.length})
            </h3>
            {imageItems.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
                {imageItems.map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => setSelectedImage(item.url)}
                    className={cn(
                      "flex flex-col overflow-hidden rounded-md border text-left",
                      item.url === selectedImage
                        ? "border-primary ring-1 ring-primary"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <img
                      src={item.url}
                      alt={item.label}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                    <span className="truncate px-1 py-0.5 text-center text-[10px] leading-4 text-muted-foreground">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Belum ada riwayat foto.
              </p>
            )}

            {selected && !selected.current && canWrite ? (
              <Button
                variant="outline"
                size="sm"
                disabled={restoring === selected.url}
                onClick={() => onRestore("image", selected.url)}
              >
                <RotateCcw />
                {restoring === selected.url
                  ? "Mengembalikan..."
                  : "Jadikan foto aktif"}
              </Button>
            ) : null}
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium">
              <FileText className="size-3.5 text-primary" />
              Dokumen ({documentItems.length})
            </h3>
            {documentItems.length > 0 ? (
              <ul className="space-y-1.5">
                {documentItems.map((item) => (
                  <li key={item.url} className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-0 flex-1 justify-start gap-2"
                      onClick={() => setDocument(item.url)}
                    >
                      <FileText className="size-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-left">
                        {item.label}
                      </span>
                    </Button>
                    {item.current || !canWrite ? null : (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="shrink-0"
                        aria-label={`Jadikan dokumen aktif: ${item.label}`}
                        title="Jadikan dokumen aktif"
                        disabled={restoring === item.url}
                        onClick={() => onRestore("document", item.url)}
                      >
                        <RotateCcw />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Belum ada riwayat dokumen.
              </p>
            )}
          </section>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <DocumentPreviewDialog
        url={document}
        title={asset.name}
        onClose={() => setDocument(null)}
      />
    </Dialog>
  )
}
