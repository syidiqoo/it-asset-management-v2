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
import type { Department, Employee, Position } from "@/lib/types"

type EmployeeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  departments: Department[]
  positions: Position[]
  onSubmit: (
    name: string,
    departmentId: number | null,
    positionId: number | null
  ) => string | null | Promise<string | null>
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
  positions,
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
  const [position, setPosition] = React.useState(
    employee?.positionId === null || employee?.positionId === undefined
      ? ""
      : String(employee.positionId)
  )
  const [error, setError] = React.useState<string | null>(null)

  const departmentOptions = React.useMemo(
    () => flattenDepartments(departments),
    [departments]
  )

  // Positions follow the selected department.
  const positionOptions = React.useMemo(
    () =>
      department === ""
        ? positions
        : positions.filter(
            (position) => position.departmentId === Number(department)
          ),
    [positions, department]
  )

  const handleDepartmentChange = (value: string | null) => {
    const next = value ?? ""
    setDepartment(next)
    // Reset the position when it does not belong to the new department.
    if (
      position !== "" &&
      positions.find(
        (item) => String(item.id) === position && item.departmentId !== null
      )?.departmentId !== Number(next)
    ) {
      setPosition("")
    }
  }

  const handlePositionChange = (value: string | null) => {
    const next = value ?? ""
    setPosition(next)
    // Selecting a position fills in the department it belongs to.
    const selected = next
      ? positions.find((item) => String(item.id) === next)
      : undefined
    if (selected?.departmentId != null) {
      setDepartment(String(selected.departmentId))
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError("Employee name is required.")
      return
    }

    const message = await onSubmit(
      trimmed,
      department ? Number(department) : null,
      position ? Number(position) : null
    )
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
          {employee ? "Edit Employee" : "Add Employee"}
        </DialogTitle>
        <DialogDescription>
          Employees are used as asset and SIM card holders. Position options
          follow the selected department.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="employee-name">Employee Name</Label>
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
              { label: "— No department —", value: "" },
              ...departmentOptions.map((node) => ({
                label: node.path,
                value: String(node.id),
              })),
            ]}
            value={department}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— No department —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— No department —</SelectItem>
              {departmentOptions.map((node) => (
                <SelectItem key={node.id} value={String(node.id)}>
                  {node.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Position</Label>
          <Select
            items={[
              { label: "— No position —", value: "" },
              ...positionOptions.map((item) => ({
                label: item.name,
                value: String(item.id),
              })),
            ]}
            value={position}
            onValueChange={handlePositionChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— No position —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— No position —</SelectItem>
              {positionOptions.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Position list comes from Settings → Position for this department.
          </p>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter className="-mx-4">
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
