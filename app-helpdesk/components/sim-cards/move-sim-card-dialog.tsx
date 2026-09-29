"use client"

import * as React from "react"
import { ArrowRightLeft } from "lucide-react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"

import { useDataStore } from "@/components/data-store"
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
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Move {card.phoneNumber}</DialogTitle>
      <DialogContent className="space-y-4">
        <DialogContentText>
          Move this SIM card between Available, Main, and Terminate.
        </DialogContentText>

        <TextField
          select
          label="Destination"
          value={section}
          onChange={(event) =>
            setSection((event.target.value as SimCardSectionKey) ?? "available")
          }
          fullWidth
          size="small"
        >
          {SECTION_ORDER.map((key) => (
            <MenuItem key={key} value={key}>
              {SIM_CARD_SECTION_LABEL[key]}
            </MenuItem>
          ))}
        </TextField>

        {section === "main" ? (
          <TextField
            select
            label="Assign to employee"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            slotProps={{
              select: { displayEmpty: true },
              inputLabel: { shrink: true },
            }}
            fullWidth
            size="small"
          >
            <MenuItem value="">Select employee</MenuItem>
            {store.employees.map((employee) => (
              <MenuItem key={employee.id} value={String(employee.id)}>
                {employee.name}
              </MenuItem>
            ))}
          </TextField>
        ) : null}

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleMove}
          startIcon={<ArrowRightLeft className="size-4" />}
        >
          Move
        </Button>
      </DialogActions>
    </Dialog>
  )
}
