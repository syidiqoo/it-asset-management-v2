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

export function DocumentPreviewDialog({
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
          <DialogTitle>Document</DialogTitle>
          <DialogDescription>{title ?? "PDF preview"}</DialogDescription>
        </DialogHeader>

        <iframe
          src={url}
          title={title ?? "PDF preview"}
          className="h-[70dvh] w-full rounded-lg border bg-muted/20"
        />

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
