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

import { flattenDepartments } from "@/lib/departments"
import type { Department, Employee } from "@/lib/types"

type EmployeeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  departments: Department[]
  onSubmit: (
    name: string,
    departmentId: number | null
  ) => string | null | Promise<string | null>
}

export function EmployeeDialog({
  open,
  onOpenChange,
  ...props
}: EmployeeDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      {open ? (
        <EmployeeDialogForm {...props} onDone={() => onOpenChange(false)} />
      ) : null}
    </Dialog>
  )
}

function EmployeeDialogForm({
  employee,
  departments,
  onSubmit,
  onDone,
}: Omit<EmployeeDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void
}) {
  const [name, setName] = React.useState(employee?.name ?? "")
  const [department, setDepartment] = React.useState(
    employee?.departmentId === null || employee?.departmentId === undefined
      ? ""
      : String(employee.departmentId)
  )
  const [error, setError] = React.useState<string | null>(null)

  const departmentOptions = React.useMemo(
    () => flattenDepartments(departments),
    [departments]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError("Employee name is required.")
      return
    }

    const message = await onSubmit(
      trimmed,
      department ? Number(department) : null
    )
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
      <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
      <DialogContent className="space-y-4">
        <DialogContentText>
          Employees are used as asset and SIM card holders.
        </DialogContentText>

        <TextField
          id="employee-name"
          label="Employee Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Budi Santoso"
          fullWidth
          size="small"
          autoFocus
        />

        <TextField
          select
          label="Department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          slotProps={{
            select: { displayEmpty: true },
            inputLabel: { shrink: true },
          }}
          fullWidth
          size="small"
        >
          <MenuItem value="">— No department —</MenuItem>
          {departmentOptions.map((node) => (
            <MenuItem key={node.id} value={String(node.id)}>
              {node.path}
            </MenuItem>
          ))}
        </TextField>

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
