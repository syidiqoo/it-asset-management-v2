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
import { RESTORE_CONFIRMATION } from "@/lib/db-backup"

export function RestoreDialog({
  open,
  onOpenChange,
  source,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: string
  onConfirm: () => Promise<string | null>
}) {
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const matched = value === RESTORE_CONFIRMATION

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
          <DialogTitle>Restore database?</DialogTitle>
          <DialogDescription>
            This replaces the entire database with the contents of{" "}
            <span className="font-medium break-all">{source}</span>. Everything
            currently in the database will be overwritten.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>
            A backup of the current database is created automatically first. You
            must type {RESTORE_CONFIRMATION} to confirm.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="restore-confirmation">
            Type {RESTORE_CONFIRMATION} to confirm
          </Label>
          <Input
            id="restore-confirmation"
            value={value}
            autoComplete="off"
            placeholder={RESTORE_CONFIRMATION}
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
            {busy ? "Restoring…" : "Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
