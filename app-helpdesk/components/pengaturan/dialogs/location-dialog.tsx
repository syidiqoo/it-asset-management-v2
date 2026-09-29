"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Save } from "lucide-react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import TextField from "@mui/material/TextField"

import {
  LOCATION_CODE_MAX,
  LOCATION_CODE_MIN,
  normalizeLocationCode,
  validateLocationCode,
} from "@/lib/locations"
import type { Location, LocationInput } from "@/lib/types"

const LocationMapPicker = dynamic(
  () =>
    import("@/components/pengaturan/location-map-picker").then(
      (mod) => mod.LocationMapPicker
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full animate-pulse rounded-lg border bg-muted" />
    ),
  }
)

type FormState = {
  code: string
  address: string
  detailStreetAddress: string
  latitude: string
  longitude: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function initialState(location: Location | null): FormState {
  if (!location) {
    return {
      code: "",
      address: "",
      detailStreetAddress: "",
      latitude: "",
      longitude: "",
    }
  }

  return {
    code: location.code,
    address: location.address ?? "",
    detailStreetAddress: location.detailStreetAddress,
    latitude: location.latitude === null ? "" : String(location.latitude),
    longitude: location.longitude === null ? "" : String(location.longitude),
  }
}

function validateCoordinate(
  value: string,
  label: string,
  limit: number
): string | null {
  if (!value.trim()) return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return `${label} must be a number.`
  if (numeric < -limit || numeric > limit) {
    return `${label} must be between -${limit} and ${limit}.`
  }
  return null
}

type LocationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location | null
  onSubmit: (input: LocationInput) => string | null | Promise<string | null>
}

export function LocationDialog({
  open,
  onOpenChange,
  ...props
}: LocationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      {open ? (
        <LocationDialogForm {...props} onDone={() => onOpenChange(false)} />
      ) : null}
    </Dialog>
  )
}

function LocationDialogForm({
  location,
  onSubmit,
  onDone,
}: Omit<LocationDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void
}) {
  const [form, setForm] = React.useState<FormState>(() => initialState(location))
  const [errors, setErrors] = React.useState<FormErrors>({})

  const set = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const parsedLatitude = form.latitude.trim() ? Number(form.latitude) : null
  const parsedLongitude = form.longitude.trim() ? Number(form.longitude) : null

  const handleMapChange = (nextLatitude: number, nextLongitude: number) => {
    setForm((previous) => ({
      ...previous,
      latitude: nextLatitude.toFixed(6),
      longitude: nextLongitude.toFixed(6),
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}

    const codeError = validateLocationCode(form.code)
    if (codeError) nextErrors.code = codeError

    if (!form.address.trim()) {
      nextErrors.address = "Address is required."
    }

    if (!form.detailStreetAddress.trim()) {
      nextErrors.detailStreetAddress = "Detail street address is required."
    }

    const latitudeError = validateCoordinate(form.latitude, "Latitude", 90)
    if (latitudeError) nextErrors.latitude = latitudeError

    const longitudeError = validateCoordinate(form.longitude, "Longitude", 180)
    if (longitudeError) nextErrors.longitude = longitudeError

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})

    const message = await onSubmit({
      code: normalizeLocationCode(form.code),
      address: form.address.trim(),
      detailStreetAddress: form.detailStreetAddress.trim(),
      latitude: form.latitude.trim() ? Number(form.latitude) : null,
      longitude: form.longitude.trim() ? Number(form.longitude) : null,
    })

    if (message) {
      setErrors({ code: message })
      return
    }

    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogTitle>{location ? "Edit Location" : "Add Location"}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Location code is {normalizeLocationCode(String(LOCATION_CODE_MIN))}
          {"–"}
          {LOCATION_CODE_MAX} and must be unique.
        </DialogContentText>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            id="location-code"
            label="Code"
            value={form.code}
            onChange={(event) => set("code", event.target.value)}
            placeholder="001"
            error={Boolean(errors.code)}
            helperText={errors.code ?? "Example: 001, 002, 100."}
            slotProps={{ htmlInput: { maxLength: 3, inputMode: "numeric" } }}
            className="font-mono sm:col-span-2"
            fullWidth
            size="small"
          />

          <div className="sm:col-span-2">
            <LocationMapPicker
              latitude={parsedLatitude}
              longitude={parsedLongitude}
              onChange={handleMapChange}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Search a place, click the map, or drag the pin to fill latitude
              and longitude.
            </p>
          </div>

          <TextField
            id="location-latitude"
            label="Latitude"
            type="number"
            value={form.latitude}
            onChange={(event) => set("latitude", event.target.value)}
            placeholder="-6.208800"
            error={Boolean(errors.latitude)}
            helperText={errors.latitude ?? undefined}
            slotProps={{ htmlInput: { step: "any" } }}
            className="font-mono"
            fullWidth
            size="small"
          />

          <TextField
            id="location-longitude"
            label="Longitude"
            type="number"
            value={form.longitude}
            onChange={(event) => set("longitude", event.target.value)}
            placeholder="106.845600"
            error={Boolean(errors.longitude)}
            helperText={errors.longitude ?? "Coordinates may be left empty."}
            slotProps={{ htmlInput: { step: "any" } }}
            className="font-mono"
            fullWidth
            size="small"
          />

          <TextField
            id="location-address"
            label="Address"
            value={form.address}
            onChange={(event) => set("address", event.target.value)}
            placeholder="Kantor Pusat"
            error={Boolean(errors.address)}
            helperText={errors.address ?? "Short location or area name."}
            className="sm:col-span-2"
            fullWidth
            size="small"
          />

          <TextField
            id="location-detail-street"
            label="Detail Street Address"
            value={form.detailStreetAddress}
            onChange={(event) => set("detailStreetAddress", event.target.value)}
            placeholder="Gedung Utama, Jl. Jenderal Sudirman No. 1, Jakarta Pusat"
            error={Boolean(errors.detailStreetAddress)}
            helperText={errors.detailStreetAddress ?? undefined}
            multiline
            minRows={2}
            className="sm:col-span-2"
            fullWidth
            size="small"
          />
        </div>
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
