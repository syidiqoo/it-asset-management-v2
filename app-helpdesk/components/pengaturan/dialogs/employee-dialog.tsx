"use client"

import * as React from "react"
import { Save } from "lucide-react"

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
import { flattenDepartments } from "@/lib/departments"
import type { Department, Employee } from "@/lib/types"

type EmployeeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  departments: Department[]
  onSubmit: (name: string, departmentId: number | null) => string | null
}

export function EmployeeDialog({
  open,
  onOpenChange,
  ...props
}: EmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <EmployeeDialogForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError("Nama employee wajib diisi.")
      return
    }

    const message = onSubmit(trimmed, department ? Number(department) : null)
    if (message) {
      setError(message)
      return
    }

    onDone()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {employee ? "Edit Employee" : "Tambah Employee"}
        </DialogTitle>
        <DialogDescription>
          Employee dipakai sebagai pemegang aset dan SIM card.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="employee-name">Nama Employee</Label>
          <Input
            id="employee-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Budi Santoso"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select
            items={[
              { label: "— Tanpa department —", value: "" },
              ...departmentOptions.map((node) => ({
                label: node.path,
                value: String(node.id),
              })),
            ]}
            value={department}
            onValueChange={(value) => setDepartment(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— Tanpa department —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Tanpa department —</SelectItem>
              {departmentOptions.map((node) => (
                <SelectItem key={node.id} value={String(node.id)}>
                  {node.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter className="-mx-4">
          <Button type="button" variant="outline" onClick={onDone}>
            Batal
          </Button>
          <Button type="submit">
            <Save />
            Simpan
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
