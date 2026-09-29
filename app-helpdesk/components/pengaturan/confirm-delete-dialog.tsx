"use client"

import * as React from "react"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  onConfirm: () => void | Promise<void | string | null>
}) {
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next) setError(null)
    onOpenChange(next)
  }

  const confirm = async () => {
    if (busy) return
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
    <Dialog
      open={open}
      onClose={() => handleOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
        {error ? (
          <Alert severity="error" className="mt-4">
            {error}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => handleOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={busy}
          onClick={confirm}
        >
          {busy ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
