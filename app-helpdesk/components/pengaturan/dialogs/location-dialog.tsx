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
import { Textarea } from "@/components/ui/textarea"
import {
  LOCATION_CODE_MAX,
  LOCATION_CODE_MIN,
  normalizeLocationCode,
  validateLocationCode,
} from "@/lib/locations"
import type { Location, LocationInput } from "@/lib/types"

type FormState = {
  code: string
  address: string
  latitude: string
  longitude: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function initialState(location: Location | null): FormState {
  if (!location) {
    return { code: "", address: "", latitude: "", longitude: "" }
  }

  return {
    code: location.code,
    address: location.address,
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
  if (!Number.isFinite(numeric)) return `${label} harus berupa angka.`
  if (numeric < -limit || numeric > limit) {
    return `${label} harus antara -${limit} dan ${limit}.`
  }
  return null
}

type LocationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location | null
  onSubmit: (input: LocationInput) => string | null
}

export function LocationDialog({
  open,
  onOpenChange,
  ...props
}: LocationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}

    const codeError = validateLocationCode(form.code)
    if (codeError) nextErrors.code = codeError

    if (!form.address.trim()) {
      nextErrors.address = "Alamat lengkap wajib diisi."
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

    const message = onSubmit({
      code: normalizeLocationCode(form.code),
      address: form.address.trim(),
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
          {location ? "Edit Location" : "Tambah Location"}
        </DialogTitle>
        <DialogDescription>
          Kode location bernilai {normalizeLocationCode(String(LOCATION_CODE_MIN))}
          {"–"}
          {LOCATION_CODE_MAX} dan harus unik.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="location-code">Kode</Label>
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
              Contoh: 001, 002, 100.
            </p>
          )}
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

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="location-address">Alamat Lengkap</Label>
          <Textarea
            id="location-address"
            value={form.address}
            onChange={(event) => set("address", event.target.value)}
            placeholder="Gedung Utama, Jl. Jenderal Sudirman No. 1, Jakarta Pusat"
            rows={2}
          />
          {errors.address ? (
            <p className="text-xs text-destructive">{errors.address}</p>
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
              Koordinat boleh dikosongkan.
            </p>
          )}
        </div>

        <DialogFooter className="sm:col-span-2">
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
