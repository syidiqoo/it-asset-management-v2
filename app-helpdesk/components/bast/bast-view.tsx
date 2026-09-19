"use client"

import * as React from "react"
import { Printer } from "lucide-react"

import { BastDocument } from "@/components/bast/bast-document"
import { useDataStore } from "@/components/data-store"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { useSessionUser } from "@/components/use-session-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  BAST_CITY_DEFAULT,
  bastFileName,
  todayIso,
  type BastItem,
} from "@/lib/bast"
import { departmentName } from "@/lib/departments"
import type { Asset } from "@/lib/types"
import { cn } from "@/lib/utils"

export function BastView() {
  const store = useDataStore()
  const sessionUser = useSessionUser()

  const [receiverId, setReceiverId] = React.useState("")
  const [nameOverride, setNameOverride] = React.useState<string | null>(null)
  const [departmentOverride, setDepartmentOverride] = React.useState<
    string | null
  >(null)
  const [giverOverride, setGiverOverride] = React.useState<string | null>(null)
  const [date, setDate] = React.useState(todayIso)
  const [place, setPlace] = React.useState(BAST_CITY_DEFAULT)
  const [accessories, setAccessories] = React.useState("")
  const [selected, setSelected] = React.useState<number[]>([])
  const [query, setQuery] = React.useState("")
  const [showAll, setShowAll] = React.useState(false)

  const receiver = React.useMemo(
    () => store.employees.find((item) => String(item.id) === receiverId) ?? null,
    [store.employees, receiverId]
  )

  const receiverName = nameOverride ?? receiver?.name ?? ""
  const receiverDepartment =
    departmentOverride ??
    departmentName(store.departments, receiver?.departmentId ?? null) ??
    ""
  const giverName = giverOverride ?? sessionUser?.name ?? ""

  const handleReceiverChange = (value: string) => {
    setReceiverId(value)
    setNameOverride(null)
    setDepartmentOverride(null)

    const employee = store.employees.find((item) => String(item.id) === value)
    setSelected(
      employee
        ? store.assets
            .filter((asset) => asset.employeeId === employee.id)
            .map((asset) => asset.id)
        : []
    )
  }

  const candidates = React.useMemo(() => {
    const text = query.trim().toLowerCase()

    return store.assets
      .filter(
        (asset) =>
          showAll || receiver === null || asset.employeeId === receiver.id
      )
      .filter((asset) => {
        if (!text) return true
        return `${asset.name} ${asset.code} ${asset.serialNumber ?? ""}`
          .toLowerCase()
          .includes(text)
      })
      .sort((a, b) => a.name.localeCompare(b.name, "id"))
  }, [store.assets, showAll, receiver, query])

  const items: BastItem[] = React.useMemo(
    () =>
      selected
        .map((id) => store.assets.find((asset) => asset.id === id))
        .filter((asset): asset is Asset => Boolean(asset))
        .map((asset) => ({
          id: asset.id,
          name: asset.name,
          serialNumber: asset.serialNumber,
        })),
    [selected, store.assets]
  )

  const accessoryLines = React.useMemo(
    () =>
      accessories
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [accessories]
  )

  const toggleAsset = (id: number) =>
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    )

  const handlePrint = () => {
    const previousTitle = document.title
    document.title = bastFileName(receiverName, date)

    const restore = () => {
      document.title = previousTitle
      window.removeEventListener("afterprint", restore)
    }

    window.addEventListener("afterprint", restore)
    window.print()
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="BAST"
          description="Buat Berita Acara Serah Terima inventaris, lalu cetak atau simpan sebagai PDF."
          actions={
            <Button size="sm" onClick={handlePrint}>
              <Printer />
              Print / Save as PDF
            </Button>
          }
        />
      </StickyHeader>

      <div className="grid gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <StoreState
          loading={store.loading}
          error={store.error}
          onRetry={store.refresh}
          empty={false}
        >
          <div className="contents">
            <div className="space-y-4">
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Penerima</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Employee</Label>
                    <Select
                      items={store.employees.map((employee) => ({
                        label: employee.name,
                        value: String(employee.id),
                      }))}
                      value={receiverId}
                      onValueChange={(value) =>
                        handleReceiverChange(value ?? "")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="— Pilih penerima —" />
                      </SelectTrigger>
                      <SelectContent>
                        {store.employees.map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={String(employee.id)}
                          >
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Aset yang sedang dipegang penerima otomatis tercentang.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="bast-receiver">Kepada</Label>
                      <Input
                        id="bast-receiver"
                        value={receiverName}
                        onChange={(event) => setNameOverride(event.target.value)}
                        placeholder="Nama penerima"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bast-department">Departemen/Base</Label>
                      <Input
                        id="bast-department"
                        value={receiverDepartment}
                        onChange={(event) =>
                          setDepartmentOverride(event.target.value)
                        }
                        placeholder="HR"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Dokumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="bast-giver">Diserahkan Oleh</Label>
                      <Input
                        id="bast-giver"
                        value={giverName}
                        onChange={(event) =>
                          setGiverOverride(event.target.value)
                        }
                        placeholder="Nama penyerah"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bast-date">Tanggal</Label>
                      <Input
                        id="bast-date"
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bast-place">Tempat</Label>
                      <Input
                        id="bast-place"
                        value={place}
                        onChange={(event) => setPlace(event.target.value)}
                        placeholder="Pangandaran"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bast-accessories">
                      Kelengkapan lainnya
                    </Label>
                    <Textarea
                      id="bast-accessories"
                      value={accessories}
                      onChange={(event) => setAccessories(event.target.value)}
                      placeholder={"Charger + Tas\nMouse"}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Satu baris = satu item.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Aset ({selected.length} dipilih)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Cari nama, code, atau serial number"
                    />
                    <Button
                      type="button"
                      variant={showAll ? "default" : "outline"}
                      className="shrink-0"
                      onClick={() => setShowAll((previous) => !previous)}
                    >
                      {showAll ? "Semua aset" : "Aset penerima"}
                    </Button>
                  </div>

                  <div className="max-h-80 overflow-y-auto rounded-lg border">
                    {candidates.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                        Tidak ada aset yang cocok.
                      </p>
                    ) : (
                      candidates.map((asset) => {
                        const checked = selected.includes(asset.id)
                        return (
                          <label
                            key={asset.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 border-b px-3 py-2 text-sm last:border-b-0",
                              checked ? "bg-primary/5" : "hover:bg-muted/60"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAsset(asset.id)}
                              className="mt-1 size-3.5 shrink-0 accent-[var(--primary)]"
                            />
                            <span className="min-w-0">
                              <span className="block truncate">{asset.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {asset.code}
                                {asset.serialNumber
                                  ? ` · ${asset.serialNumber}`
                                  : ""}
                              </span>
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <BastDocument
                doc={{
                  date,
                  place,
                  receiverName,
                  receiverDepartment,
                  giverName,
                  accessories: accessoryLines,
                  items,
                }}
              />
            </div>
          </div>
        </StoreState>
      </div>
    </div>
  )
}
