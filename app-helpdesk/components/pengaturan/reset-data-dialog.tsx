"use client"

import * as React from "react"

import { TriangleAlert } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RESET_CONFIRMATION } from "@/lib/reset-data"

export function ResetDataDialog({
  open,
  onOpenChange,
  counts,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  counts: { asset: number; simCard: number; internetData: number }
  onConfirm: () => Promise<string | null>
}) {
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const matched = value === RESET_CONFIRMATION

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setValue("")
      setError(null)
    }
    onOpenChange(next)
  }

  const confirm = async () => {
    if (busy || !matched) return
    setError(null)
    setBusy(true)
    try {
      const message = await onConfirm()
      if (message) setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete all transactional data?</DialogTitle>
          <DialogDescription>
            This permanently deletes {counts.asset} assets, {counts.simCard} SIM
            cards and {counts.internetData} internet records, including asset
            file history. Master data and user accounts are kept.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>
            This action cannot be undone. A backup file is created automatically
            before the data is removed.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="reset-confirmation">
            Type {RESET_CONFIRMATION} to confirm
          </Label>
          <Input
            id="reset-confirmation"
            value={value}
            autoComplete="off"
            placeholder={RESET_CONFIRMATION}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy || !matched}
            onClick={confirm}
          >
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
