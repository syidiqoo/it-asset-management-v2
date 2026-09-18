"use client"

import * as React from "react"
import { Save } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/format"
import { normalizeInternetId, validateInternetId } from "@/lib/internet"
import { formatLocationLabel } from "@/lib/locations"
import type { InternetData, InternetDataInput } from "@/lib/types"

type FormState = {
  internetId: string
  locationId: string
  service: string
  bandwidth: string
  customerName: string
  monthlyCost: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function initialState(item: InternetData | null): FormState {
  if (!item) {
    return {
      internetId: "",
      locationId: "",
      service: "",
      bandwidth: "",
      customerName: "",
      monthlyCost: "",
    }
  }

  return {
    internetId: item.internetId,
    locationId: item.locationId === null ? "" : String(item.locationId),
    service: item.service,
    bandwidth: String(item.bandwidthMbps),
    customerName: item.customerName,
    monthlyCost: String(item.monthlyCost),
  }
}

type InternetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InternetData | null
  onSubmit: (input: InternetDataInput) => string | null
}

export function InternetDialog({
  open,
  onOpenChange,
  ...props
}: InternetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <InternetDialogForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function InternetDialogForm({
  item,
  onSubmit,
  onDone,
}: Omit<InternetDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void
}) {
  const store = useDataStore()
  const [form, setForm] = React.useState<FormState>(() => initialState(item))
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

    const internetIdError = validateInternetId(form.internetId)
    if (internetIdError) nextErrors.internetId = internetIdError

    if (!form.locationId) {
      nextErrors.locationId = "Lokasi wajib dipilih."
    }
    if (!form.service.trim()) {
      nextErrors.service = "Layanan wajib diisi."
    }
    if (!form.customerName.trim()) {
      nextErrors.customerName = "Nama pelanggan wajib diisi."
    }

    const bandwidth = Number(form.bandwidth)
    if (!form.bandwidth.trim()) {
      nextErrors.bandwidth = "Bandwidth wajib diisi."
    } else if (!Number.isFinite(bandwidth) || bandwidth <= 0) {
      nextErrors.bandwidth = "Bandwidth harus lebih besar dari 0."
    }

    const monthlyCost = Number(form.monthlyCost)
    if (!form.monthlyCost.trim()) {
      nextErrors.monthlyCost = "Biaya bulanan wajib diisi."
    } else if (!Number.isFinite(monthlyCost) || monthlyCost < 0) {
      nextErrors.monthlyCost = "Biaya bulanan tidak boleh negatif."
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})

    const message = onSubmit({
      internetId: normalizeInternetId(form.internetId),
      locationId: Number(form.locationId),
      service: form.service.trim(),
      bandwidthMbps: bandwidth,
      customerName: form.customerName.trim(),
      monthlyCost,
    })

    if (message) {
      setErrors({ internetId: message })
      return
    }

    onDone()
  }

  const monthlyCost = Number(form.monthlyCost)
  const monthlyCostHint =
    form.monthlyCost.trim() && Number.isFinite(monthlyCost) && monthlyCost >= 0
      ? formatCurrency(monthlyCost)
      : null

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {item ? "Edit Data Internet" : "Tambah Data Internet"}
        </DialogTitle>
        <DialogDescription>
          ID Internet harus unik dan lokasi dipilih dari master Location.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="internet-id">ID Internet</Label>
          <Input
            id="internet-id"
            value={form.internetId}
            onChange={(event) =>
              set("internetId", event.target.value.replace(/\D/g, ""))
            }
            placeholder="1001"
            inputMode="numeric"
            className="font-mono"
          />
          {errors.internetId ? (
            <p className="text-xs text-destructive">{errors.internetId}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Hanya angka.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="internet-service">Layanan</Label>
          <Input
            id="internet-service"
            value={form.service}
            onChange={(event) => set("service", event.target.value)}
            placeholder="Fiber Optic"
          />
          {errors.service ? (
            <p className="text-xs text-destructive">{errors.service}</p>
          ) : null}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>Lokasi</Label>
          <Select
            items={store.locations.map((location) => ({
              label: formatLocationLabel(location),
              value: String(location.id),
            }))}
            value={form.locationId}
            onValueChange={(value) => set("locationId", value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih lokasi" />
            </SelectTrigger>
            <SelectContent>
              {store.locations.map((location) => (
                <SelectItem key={location.id} value={String(location.id)}>
                  {formatLocationLabel(location)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.locationId ? (
            <p className="text-xs text-destructive">{errors.locationId}</p>
          ) : null}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="internet-customer">Nama Pelanggan</Label>
          <Input
            id="internet-customer"
            value={form.customerName}
            onChange={(event) => set("customerName", event.target.value)}
            placeholder="PT Nusantara Jaya"
          />
          {errors.customerName ? (
            <p className="text-xs text-destructive">{errors.customerName}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="internet-bandwidth">Bandwidth</Label>
          <div className="relative">
            <Input
              id="internet-bandwidth"
              type="number"
              min={1}
              step="any"
              value={form.bandwidth}
              onChange={(event) => set("bandwidth", event.target.value)}
              placeholder="100"
              className="pr-14 font-mono"
            />
            <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
              Mbps
            </span>
          </div>
          {errors.bandwidth ? (
            <p className="text-xs text-destructive">{errors.bandwidth}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="internet-cost">Biaya Bulanan</Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
              Rp
            </span>
            <Input
              id="internet-cost"
              type="number"
              min={0}
              step="any"
              value={form.monthlyCost}
              onChange={(event) => set("monthlyCost", event.target.value)}
              placeholder="4500000"
              className="pl-9 font-mono"
            />
          </div>
          {errors.monthlyCost ? (
            <p className="text-xs text-destructive">{errors.monthlyCost}</p>
          ) : monthlyCostHint ? (
            <p className="text-xs text-muted-foreground">{monthlyCostHint}</p>
          ) : null}
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
