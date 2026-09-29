"use client"

import * as React from "react"
import { Save } from "lucide-react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import TextField from "@mui/material/TextField"

type NameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  label: string
  placeholder?: string
  initialValue?: string
  onSubmit: (value: string) => string | null | Promise<string | null>
}

export function NameDialog({ open, onOpenChange, ...props }: NameDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      {open ? <NameDialogForm {...props} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  )
}

function NameDialogForm({
  title,
  description,
  label,
  placeholder,
  initialValue,
  onSubmit,
  onDone,
}: Omit<NameDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void
}) {
  const [value, setValue] = React.useState(initialValue ?? "")
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = value.trim()
    if (!trimmed) {
      setError(`${label} is required.`)
      return
    }

    const message = await onSubmit(trimmed)
    if (message) {
      setError(message)
      return
    }

    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
        <TextField
          id="name-dialog-input"
          label={label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          error={Boolean(error)}
          helperText={error ?? undefined}
          autoFocus
          fullWidth
          size="small"
          className="mt-4"
        />
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={<Save className="size-4" />}
        >
          Save
        </Button>
      </DialogActions>
    </form>
  )
}
