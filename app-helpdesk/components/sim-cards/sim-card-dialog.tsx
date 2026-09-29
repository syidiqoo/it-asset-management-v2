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

import { useDataStore } from "@/components/data-store"
import { flattenDepartments } from "@/lib/departments"
import type { SimCard, SimCardInput } from "@/lib/types"

type FormState = {
  phoneNumber: string
  employeeId: string
  departmentId: string
  packageId: string
  clsDomestic: string
  clsRoaming: string
  note: string
}

function initialState(card: SimCard | null): FormState {
  if (!card) {
    return {
      phoneNumber: "",
      employeeId: "",
      departmentId: "",
      packageId: "",
      clsDomestic: "",
      clsRoaming: "",
      note: "",
    }
  }

  return {
    phoneNumber: card.phoneNumber,
    employeeId: card.employeeId === null ? "" : String(card.employeeId),
    departmentId: card.departmentId === null ? "" : String(card.departmentId),
    packageId: card.packageId === null ? "" : String(card.packageId),
    clsDomestic: card.clsDomestic ?? "",
    clsRoaming: card.clsRoaming ?? "",
    note: card.note ?? "",
  }
}

export function SimCardFormDialog({
  open,
  onOpenChange,
  card,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: SimCard | null
}) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      {open ? (
        <SimCardForm card={card} onDone={() => onOpenChange(false)} />
      ) : null}
    </Dialog>
  )
}

function SimCardForm({
  card,
  onDone,
}: {
  card: SimCard | null
  onDone: () => void
}) {
  const store = useDataStore()
  const [form, setForm] = React.useState<FormState>(() => initialState(card))
  const [error, setError] = React.useState<string | null>(null)

  const set = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const departmentOptions = React.useMemo(
    () => flattenDepartments(store.departments),
    [store.departments]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const phoneNumber = form.phoneNumber.trim()
    if (!phoneNumber) {
      setError("Phone Number is required.")
      return
    }

    const input: SimCardInput = {
      phoneNumber,
      employeeId: form.employeeId ? Number(form.employeeId) : null,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      packageId: form.packageId ? Number(form.packageId) : null,
      clsDomestic: form.clsDomestic.trim() || null,
      clsRoaming: form.clsRoaming.trim() || null,
      note: form.note.trim() || null,
      terminated: card?.terminated ?? false,
    }

    try {
      if (card) {
        await store.updateSimCard(card.id, input)
      } else {
        await store.createSimCard(input)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.")
      return
    }

    onDone()
  }

  return (
    <>
      <DialogTitle>{card ? "Edit SIM Card" : "Add SIM Card"}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Phone Number must be unique. Employee, Department, and Package are
          selected from master data.
        </DialogContentText>

        <form
          id="sim-card-form"
          onSubmit={handleSubmit}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <TextField
            id="sim-phone"
            label="Phone Number"
            value={form.phoneNumber}
            onChange={(event) => set("phoneNumber", event.target.value)}
            placeholder="081210000001"
            error={Boolean(error)}
            helperText={error ?? undefined}
            slotProps={{ htmlInput: { className: "font-mono" } }}
            className="sm:col-span-2"
            fullWidth
            size="small"
          />

          <TextField
            select
            label="Employee"
            value={form.employeeId}
            onChange={(event) => set("employeeId", event.target.value)}
            slotProps={{
              select: { displayEmpty: true },
              inputLabel: { shrink: true },
            }}
            fullWidth
            size="small"
          >
            <MenuItem value="">— No holder —</MenuItem>
            {store.employees.map((employee) => (
              <MenuItem key={employee.id} value={String(employee.id)}>
                {employee.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Department"
            value={form.departmentId}
            onChange={(event) => set("departmentId", event.target.value)}
            slotProps={{
              select: { displayEmpty: true },
              inputLabel: { shrink: true },
            }}
            fullWidth
            size="small"
          >
            <MenuItem value="">— No department —</MenuItem>
            {departmentOptions.map((department) => (
              <MenuItem key={department.id} value={String(department.id)}>
                {department.path}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Package"
            value={form.packageId}
            onChange={(event) => set("packageId", event.target.value)}
            slotProps={{
              select: { displayEmpty: true },
              inputLabel: { shrink: true },
            }}
            fullWidth
            size="small"
          >
            <MenuItem value="">— No package —</MenuItem>
            {store.simPackages.map((item) => (
              <MenuItem key={item.id} value={String(item.id)}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            id="sim-cls-domestic"
            label="CLS Domestic"
            value={form.clsDomestic}
            onChange={(event) => set("clsDomestic", event.target.value)}
            placeholder="CLS Domestic 25 GB"
            fullWidth
            size="small"
          />

          <TextField
            id="sim-cls-roaming"
            label="CLS Roaming"
            value={form.clsRoaming}
            onChange={(event) => set("clsRoaming", event.target.value)}
            placeholder="CLS Roaming 5 GB"
            className="sm:col-span-2"
            fullWidth
            size="small"
          />

          <TextField
            id="sim-note"
            label="Note"
            value={form.note}
            onChange={(event) => set("note", event.target.value)}
            placeholder="Catatan tambahan, mis. nomor sudah tidak dipakai"
            multiline
            minRows={3}
            className="sm:col-span-2"
            fullWidth
            size="small"
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="sim-card-form"
          variant="contained"
          startIcon={<Save className="size-4" />}
        >
          Save
        </Button>
      </DialogActions>
    </>
  )
}
