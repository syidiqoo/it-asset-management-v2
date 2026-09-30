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
import {
  collectDescendantIds,
  flattenDepartments,
  MAX_DEPARTMENT_LEVEL,
} from "@/lib/departments"
import type { Department, DepartmentNode, Location } from "@/lib/types"

type DepartmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: DepartmentNode | null
  departments: Department[]
  locations: Location[]
  defaultParentId: number | null
  onSubmit: (
    name: string,
    parentId: number | null,
    locationId: number | null
  ) => string | null | Promise<string | null>
}

export function DepartmentDialog({
  open,
  onOpenChange,
  ...props
}: DepartmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DepartmentDialogForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function DepartmentDialogForm({
  department,
  departments,
  locations,
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
  const [location, setLocation] = React.useState(
    department?.locationId ? String(department.locationId) : ""
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

  const locationOptions = React.useMemo(
    () =>
      [...locations]
        .sort((a, b) => Number(a.code) - Number(b.code))
        .map((item) => ({
          label: `${item.code} · ${item.address ?? item.detailStreetAddress}`,
          value: String(item.id),
        })),
    [locations]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError("Department name is required.")
      return
    }

    const message = await onSubmit(
      trimmed,
      parent ? Number(parent) : null,
      location ? Number(location) : null
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
          {department ? "Edit Department" : "Add Department"}
        </DialogTitle>
        <DialogDescription>
          Departments can nest via parent, maximum{" "}
          {MAX_DEPARTMENT_LEVEL} levels.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="department-name">Department Name</Label>
          <Input
            id="department-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Base Jakarta"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Parent Department</Label>
          <Select
            items={[
              { label: "— No parent (level 1) —", value: "" },
              ...parentOptions.map((node) => ({
                label: node.path,
                value: String(node.id),
              })),
            ]}
            value={parent}
            onValueChange={(value) => setParent(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— No parent —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— No parent (level 1) —</SelectItem>
              {parentOptions.map((node) => (
                <SelectItem key={node.id} value={String(node.id)}>
                  {node.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This department will be at level {parentLevel + 1}.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Location</Label>
          <Select
            items={[
              { label: "— No location —", value: "" },
              ...locationOptions,
            ]}
            value={location}
            onValueChange={(value) => setLocation(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— No location —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— No location —</SelectItem>
              {locationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Used by the Summary page to group this department under a location.
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
