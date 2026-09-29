"use client"

import * as React from "react"
import { Save } from "lucide-react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"

import {
  collectDescendantIds,
  flattenDepartments,
  MAX_DEPARTMENT_LEVEL,
} from "@/lib/departments"
import type { Department, DepartmentNode } from "@/lib/types"

type DepartmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: DepartmentNode | null
  departments: Department[]
  defaultParentId: number | null
  onSubmit: (
    name: string,
    parentId: number | null
  ) => string | null | Promise<string | null>
}

export function DepartmentDialog({
  open,
  onOpenChange,
  ...props
}: DepartmentDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      {open ? (
        <DepartmentDialogForm {...props} onDone={() => onOpenChange(false)} />
      ) : null}
    </Dialog>
  )
}

function DepartmentDialogForm({
  department,
  departments,
  defaultParentId,
  onSubmit,
  onDone,
}: Omit<DepartmentDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void
}) {
  const [name, setName] = React.useState(department?.name ?? "")
  const [parent, setParent] = React.useState(
    department
      ? department.parentId === null
        ? ""
        : String(department.parentId)
      : defaultParentId === null
        ? ""
        : String(defaultParentId)
  )
  const [error, setError] = React.useState<string | null>(null)

  const parentOptions = React.useMemo(() => {
    const blocked = department
      ? collectDescendantIds(departments, department.id)
      : new Set<number>()

    return flattenDepartments(departments).filter(
      (node) => node.level < MAX_DEPARTMENT_LEVEL && !blocked.has(node.id)
    )
  }, [departments, department])

  const parentLevel = parent
    ? (parentOptions.find((node) => String(node.id) === parent)?.level ?? 1)
    : 0

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError("Department name is required.")
      return
    }

    const message = await onSubmit(trimmed, parent ? Number(parent) : null)
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
      <DialogTitle>
        {department ? "Edit Department" : "Add Department"}
      </DialogTitle>
      <DialogContent className="space-y-4">
        <DialogContentText>
          Departments can nest via parent, maximum {MAX_DEPARTMENT_LEVEL}{" "}
          levels.
        </DialogContentText>

        <TextField
          id="department-name"
          label="Department Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Base Jakarta"
          fullWidth
          size="small"
          autoFocus
        />

        <div>
          <TextField
            select
            label="Parent Department"
            value={parent}
            onChange={(event) => setParent(event.target.value)}
            slotProps={{
              select: { displayEmpty: true },
              inputLabel: { shrink: true },
            }}
            fullWidth
            size="small"
          >
            <MenuItem value="">— No parent (level 1) —</MenuItem>
            {parentOptions.map((node) => (
              <MenuItem key={node.id} value={String(node.id)}>
                {node.path}
              </MenuItem>
            ))}
          </TextField>
          <p className="mt-1 text-xs text-muted-foreground">
            This department will be at level {parentLevel + 1}.
          </p>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
