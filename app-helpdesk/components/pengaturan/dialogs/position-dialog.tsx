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
import type { Department, Position } from "@/lib/types"

type PositionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: Position | null
  departments: Department[]
  onSubmit: (
    name: string,
    departmentId: number | null
  ) => string | null | Promise<string | null>
}

export function PositionDialog({
  open,
  onOpenChange,
  ...props
}: PositionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <PositionDialogForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function PositionDialogForm({
  position,
  departments,
  onSubmit,
  onDone,
}: Omit<PositionDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void
}) {
  const [name, setName] = React.useState(position?.name ?? "")
  const [department, setDepartment] = React.useState(
    position?.departmentId === null || position?.departmentId === undefined
      ? ""
      : String(position.departmentId)
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
      setError("Position name is required.")
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
    <>
      <DialogHeader>
        <DialogTitle>{position ? "Edit Position" : "Add Position"}</DialogTitle>
        <DialogDescription>
          Positions are job titles that belong to a department and are picked
          as employee positions.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="position-name">Position Name</Label>
          <Input
            id="position-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="BC Padang"
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
            onValueChange={(value) => setDepartment(value ?? "")}
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
