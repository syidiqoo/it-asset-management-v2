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
