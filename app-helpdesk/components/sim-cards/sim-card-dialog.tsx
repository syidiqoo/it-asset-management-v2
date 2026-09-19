"use client"

import * as React from "react"
import { Save } from "lucide-react"

import { useDataStore } from "@/components/data-store"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
    departmentId:
      card.departmentId === null ? "" : String(card.departmentId),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <SimCardForm card={card} onDone={() => onOpenChange(false)} />
      </DialogContent>
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
      <DialogHeader>
        <DialogTitle>{card ? "Edit SIM Card" : "Add SIM Card"}</DialogTitle>
        <DialogDescription>
          Phone Number must be unique. Employee, Department, and Package are selected from master data.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sim-phone">Phone Number</Label>
          <Input
            id="sim-phone"
            value={form.phoneNumber}
            onChange={(event) => set("phoneNumber", event.target.value)}
            placeholder="081210000001"
            className="font-mono"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label>Employee</Label>
          <Select
            items={[
              { label: "— No holder —", value: "" },
              ...store.employees.map((employee) => ({
                label: employee.name,
                value: String(employee.id),
              })),
            ]}
            value={form.employeeId}
            onValueChange={(value) => set("employeeId", value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— No holder —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— No holder —</SelectItem>
              {store.employees.map((employee) => (
                <SelectItem key={employee.id} value={String(employee.id)}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select
            items={[
              { label: "— No department —", value: "" },
              ...departmentOptions.map((department) => ({
                label: department.path,
                value: String(department.id),
              })),
            ]}
            value={form.departmentId}
            onValueChange={(value) => set("departmentId", value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— No department —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— No department —</SelectItem>
              {departmentOptions.map((department) => (
                <SelectItem key={department.id} value={String(department.id)}>
                  {department.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Package</Label>
          <Select
            items={[
              { label: "— No package —", value: "" },
              ...store.simPackages.map((item) => ({
                label: item.name,
                value: String(item.id),
              })),
            ]}
            value={form.packageId}
            onValueChange={(value) => set("packageId", value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— No package —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— No package —</SelectItem>
              {store.simPackages.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sim-cls-domestic">CLS Domestic</Label>
          <Input
            id="sim-cls-domestic"
            value={form.clsDomestic}
            onChange={(event) => set("clsDomestic", event.target.value)}
            placeholder="CLS Domestic 25 GB"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sim-cls-roaming">CLS Roaming</Label>
          <Input
            id="sim-cls-roaming"
            value={form.clsRoaming}
            onChange={(event) => set("clsRoaming", event.target.value)}
            placeholder="CLS Roaming 5 GB"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sim-note">Note</Label>
          <Textarea
            id="sim-note"
            value={form.note}
            onChange={(event) => set("note", event.target.value)}
            placeholder="Catatan tambahan, mis. nomor sudah tidak dipakai"
            rows={3}
          />
        </div>

        <DialogFooter className="sm:col-span-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit">
            <Save />
            Save
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
