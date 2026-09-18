"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Save, X } from "lucide-react"

import { FileUploadField } from "@/components/assets/file-upload-field"
import { useDataStore } from "@/components/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { flattenDepartments } from "@/lib/departments"
import { ADMIN_NAME } from "@/lib/mock-data"
import {
  CONDITIONS,
  type Asset,
  type AssetInput,
  type Condition,
} from "@/lib/types"

const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif"
const IMAGE_MAX_SIZE = 2 * 1024 * 1024
const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.txt"
const DOCUMENT_MAX_SIZE = 5 * 1024 * 1024

type FormState = {
  categoryId: string
  name: string
  code: string
  serialNumber: string
  employeeId: string
  departmentId: string
  condition: Condition
  recordDate: string
  purchaseDate: string
  note: string
}

type FormErrors = Partial<Record<"categoryId" | "name" | "code", string>>

function today() {
  return new Date().toISOString().slice(0, 10)
}

function initialState(asset?: Asset): FormState {
  if (!asset) {
    return {
      categoryId: "",
      name: "",
      code: "",
      serialNumber: "",
      employeeId: "",
      departmentId: "",
      condition: "Good",
      recordDate: today(),
      purchaseDate: "",
      note: "",
    }
  }

  return {
    categoryId: String(asset.categoryId),
    name: asset.name,
    code: asset.code,
    serialNumber: asset.serialNumber ?? "",
    employeeId: asset.employeeId === null ? "" : String(asset.employeeId),
    departmentId:
      asset.departmentId === null ? "" : String(asset.departmentId),
    condition: asset.condition,
    recordDate: asset.recordDate,
    purchaseDate: asset.purchaseDate ?? "",
    note: asset.note ?? "",
  }
}

function resolveUrl(
  file: File | null,
  cleared: boolean,
  current: string | null | undefined
) {
  if (file) return URL.createObjectURL(file)
  if (cleared) return null
  return current ?? null
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function AssetForm({ asset }: { asset?: Asset }) {
  const router = useRouter()
  const store = useDataStore()

  const [form, setForm] = React.useState<FormState>(() => initialState(asset))
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imageCleared, setImageCleared] = React.useState(false)
  const [docFile, setDocFile] = React.useState<File | null>(null)
  const [docCleared, setDocCleared] = React.useState(false)

  const set = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const departmentOptions = React.useMemo(
    () => flattenDepartments(store.departments),
    [store.departments]
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    if (!form.categoryId) nextErrors.categoryId = "Kategori wajib dipilih."
    if (!form.name.trim()) nextErrors.name = "Nama aset wajib diisi."

    const code = form.code.trim()
    if (!code) {
      nextErrors.code = "Code wajib diisi."
    } else if (
      store.assets.some(
        (item) =>
          item.id !== asset?.id &&
          item.code.trim().toLowerCase() === code.toLowerCase()
      )
    ) {
      nextErrors.code = "Code sudah dipakai aset lain."
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})

    const input: AssetInput = {
      categoryId: Number(form.categoryId),
      name: form.name.trim(),
      code,
      serialNumber: form.serialNumber.trim() || null,
      employeeId: form.employeeId ? Number(form.employeeId) : null,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      condition: form.condition,
      imageUrl: resolveUrl(imageFile, imageCleared, asset?.imageUrl),
      docUrl: resolveUrl(docFile, docCleared, asset?.docUrl),
      recordDate: form.recordDate || today(),
      purchaseDate: form.purchaseDate || null,
      note: form.note.trim() || null,
    }

    if (asset) {
      store.updateAsset(asset.id, input)
    } else {
      store.createAsset(input)
    }

    router.push("/assets")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="space-y-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Informasi Aset</p>
            <p className="text-xs text-muted-foreground">
              Kolom bertanda wajib harus diisi sebelum menyimpan.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Kategori" error={errors.categoryId}>
              <Select
                items={store.categories.map((category) => ({
                  label: category.name,
                  value: String(category.id),
                }))}
                value={form.categoryId}
                onValueChange={(value) => set("categoryId", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {store.categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Kondisi">
              <Select
                items={CONDITIONS.map((condition) => ({
                  label: condition,
                  value: condition,
                }))}
                value={form.condition}
                onValueChange={(value) =>
                  set("condition", (value as Condition | null) ?? "Good")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Nama Aset" htmlFor="asset-name" error={errors.name}>
              <Input
                id="asset-name"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="MacBook Pro 14 M3"
              />
            </Field>

            <Field
              label="Code"
              htmlFor="asset-code"
              error={errors.code}
              hint="Kode unik inventaris, contoh AST-2026-001."
            >
              <Input
                id="asset-code"
                value={form.code}
                onChange={(event) => set("code", event.target.value)}
                placeholder="AST-2026-001"
                className="font-mono"
              />
            </Field>

            <Field label="Serial Number" htmlFor="asset-serial">
              <Input
                id="asset-serial"
                value={form.serialNumber}
                onChange={(event) => set("serialNumber", event.target.value)}
                placeholder="C02X1Y2Z3ABC"
                className="font-mono"
              />
            </Field>

            <Field label="Updated By">
              <Input value={ADMIN_NAME} disabled readOnly />
              <p className="text-xs text-muted-foreground">
                Terisi otomatis dari admin yang login.
              </p>
            </Field>

            <Field label="Employee">
              <Select
                items={[
                  { label: "— Tanpa pemegang —", value: "" },
                  ...store.employees.map((employee) => ({
                    label: employee.name,
                    value: String(employee.id),
                  })),
                ]}
                value={form.employeeId}
                onValueChange={(value) => set("employeeId", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Tanpa pemegang —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Tanpa pemegang —</SelectItem>
                  {store.employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Department">
              <Select
                items={[
                  { label: "— Tanpa department —", value: "" },
                  ...departmentOptions.map((department) => ({
                    label: department.path,
                    value: String(department.id),
                  })),
                ]}
                value={form.departmentId}
                onValueChange={(value) => set("departmentId", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Tanpa department —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Tanpa department —</SelectItem>
                  {departmentOptions.map((department) => (
                    <SelectItem
                      key={department.id}
                      value={String(department.id)}
                    >
                      {department.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Record Date" htmlFor="asset-record-date">
              <Input
                id="asset-record-date"
                type="date"
                value={form.recordDate}
                onChange={(event) => set("recordDate", event.target.value)}
              />
            </Field>

            <Field label="Purchase Date" htmlFor="asset-purchase-date">
              <Input
                id="asset-purchase-date"
                type="date"
                value={form.purchaseDate}
                onChange={(event) => set("purchaseDate", event.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">Catatan</p>
          <Textarea
            value={form.note}
            onChange={(event) => set("note", event.target.value)}
            placeholder="Kondisi khusus, riwayat perbaikan, atau keterangan lain."
            rows={3}
          />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="space-y-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Berkas</p>
            <p className="text-xs text-muted-foreground">
              Gambar maksimal 2 MB, dokumen maksimal 5 MB.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FileUploadField
              id="asset-image"
              title="Gambar Aset"
              hint="PNG, JPG, WEBP, atau GIF (maks 2 MB)"
              accept={IMAGE_ACCEPT}
              maxSize={IMAGE_MAX_SIZE}
              kind="image"
              initialUrl={asset?.imageUrl}
              onFileChange={(file) => {
                setImageFile(file)
                if (file === null) setImageCleared(true)
              }}
            />
            <FileUploadField
              id="asset-document"
              title="Dokumen Pendukung"
              hint="PDF, DOC, DOCX, XLS, XLSX, atau TXT (maks 5 MB)"
              accept={DOCUMENT_ACCEPT}
              maxSize={DOCUMENT_MAX_SIZE}
              kind="document"
              initialUrl={asset?.docUrl}
              onFileChange={(file) => {
                setDocFile(file)
                if (file === null) setDocCleared(true)
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" render={<Link href="/assets" />}>
          <X />
          Batal
        </Button>
        <Button type="submit">
          <Save />
          Simpan Aset
        </Button>
      </div>
    </form>
  )
}
