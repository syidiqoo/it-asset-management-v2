"use client"

import * as React from "react"
import dynamic from "next/dynamic"
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
import { Textarea } from "@/components/ui/textarea"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <LocationDialogForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
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
    <>
      <DialogHeader>
        <DialogTitle>
          {location ? "Edit Location" : "Add Location"}
        </DialogTitle>
        <DialogDescription>
          Location code is {normalizeLocationCode(String(LOCATION_CODE_MIN))}
          {"–"}
          {LOCATION_CODE_MAX} and must be unique.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="location-code">Code</Label>
          <Input
            id="location-code"
            value={form.code}
            onChange={(event) => set("code", event.target.value)}
            placeholder="001"
            maxLength={3}
            inputMode="numeric"
            className="font-mono"
          />
          {errors.code ? (
            <p className="text-xs text-destructive">{errors.code}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Example: 001, 002, 100.
            </p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>Map</Label>
          <LocationMapPicker
            latitude={parsedLatitude}
            longitude={parsedLongitude}
            onChange={handleMapChange}
          />
          <p className="text-xs text-muted-foreground">
            Search a place, click the map, or drag the pin to fill latitude and
            longitude.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location-latitude">Latitude</Label>
          <Input
            id="location-latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(event) => set("latitude", event.target.value)}
            placeholder="-6.208800"
            className="font-mono"
          />
          {errors.latitude ? (
            <p className="text-xs text-destructive">{errors.latitude}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location-longitude">Longitude</Label>
          <Input
            id="location-longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) => set("longitude", event.target.value)}
            placeholder="106.845600"
            className="font-mono"
          />
          {errors.longitude ? (
            <p className="text-xs text-destructive">{errors.longitude}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Coordinates may be left empty.
            </p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="location-address">Address</Label>
          <Input
            id="location-address"
            value={form.address}
            onChange={(event) => set("address", event.target.value)}
            placeholder="Kantor Pusat"
          />
          {errors.address ? (
            <p className="text-xs text-destructive">{errors.address}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Short location or area name.
            </p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="location-detail-street">Detail Street Address</Label>
          <Textarea
            id="location-detail-street"
            value={form.detailStreetAddress}
            onChange={(event) => set("detailStreetAddress", event.target.value)}
            placeholder="Gedung Utama, Jl. Jenderal Sudirman No. 1, Jakarta Pusat"
            rows={2}
          />
          {errors.detailStreetAddress ? (
            <p className="text-xs text-destructive">
              {errors.detailStreetAddress}
            </p>
          ) : null}
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
