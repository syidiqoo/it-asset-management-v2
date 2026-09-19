"use client"

import * as React from "react"
import { ArrowRightLeft } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SIM_CARD_SECTION_LABEL,
  simCardSection,
  type SimCardSectionKey,
} from "@/lib/sim-cards"
import type { SimCard } from "@/lib/types"

const SECTION_ORDER: SimCardSectionKey[] = ["available", "main", "terminated"]

export function MoveSimCardDialog({
  card,
  onClose,
}: {
  card: SimCard | null
  onClose: () => void
}) {
  if (!card) return null

  return <MoveSimCardForm key={card.id} card={card} onClose={onClose} />
}

function MoveSimCardForm({
  card,
  onClose,
}: {
  card: SimCard
  onClose: () => void
}) {
  const store = useDataStore()
  const [section, setSection] = React.useState<SimCardSectionKey>(() =>
    simCardSection(card)
  )
  const [employeeId, setEmployeeId] = React.useState(
    card.employeeId === null ? "" : String(card.employeeId)
  )
  const [error, setError] = React.useState<string | null>(null)

  const handleMove = async () => {
    if (section === "main" && !employeeId) {
      setError("Select an employee to assign this SIM card.")
      return
    }
    setError(null)

    try {
      await store.updateSimCard(card.id, {
        phoneNumber: card.phoneNumber,
        employeeId:
          section === "main"
            ? Number(employeeId)
            : section === "terminated"
              ? card.employeeId
              : null,
        departmentId: card.departmentId,
        packageId: card.packageId,
        clsDomestic: card.clsDomestic,
        clsRoaming: card.clsRoaming,
        note: card.note,
        terminated: section === "terminated",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move failed.")
      return
    }

    onClose()
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {card.phoneNumber}</DialogTitle>
          <DialogDescription>
            Move this SIM card between Available, Main, and Terminate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Destination</Label>
            <Select
              items={SECTION_ORDER.map((key) => ({
                label: SIM_CARD_SECTION_LABEL[key],
                value: key,
              }))}
              value={section}
              onValueChange={(value) =>
                setSection((value as SimCardSectionKey | null) ?? "available")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_ORDER.map((key) => (
                  <SelectItem key={key} value={key}>
                    {SIM_CARD_SECTION_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {section === "main" ? (
            <div className="space-y-1.5">
              <Label>Assign to employee</Label>
              <Select
                items={[
                  { label: "Select employee", value: "" },
                  ...store.employees.map((employee) => ({
                    label: employee.name,
                    value: String(employee.id),
                  })),
                ]}
                value={employeeId}
                onValueChange={(value) => setEmployeeId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select employee</SelectItem>
                  {store.employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove}>
            <ArrowRightLeft />
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
