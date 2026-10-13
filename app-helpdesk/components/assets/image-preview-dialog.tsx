"use client"

import { ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ImagePreviewDialog({
  url,
  title,
  onClose,
}: {
  url: string | null
  title?: string
  onClose: () => void
}) {
  if (!url) return null

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Image</DialogTitle>
          <DialogDescription>{title ?? "Image preview"}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center rounded-lg border bg-muted/20">
          <img
            src={url}
            alt={title ?? "Image preview"}
            className="max-h-[70dvh] w-full rounded-lg object-contain"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button render={<a href={url} target="_blank" rel="noreferrer" />}>
            <ExternalLink />
            Open in new tab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
