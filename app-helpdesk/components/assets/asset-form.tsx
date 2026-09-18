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
import {
  UPLOAD_KINDS,
  uploadAccept,
  uploadHint,
  type UploadKind,
} from "@/lib/uploads"
import {
  CONDITIONS,
  type Asset,
  type AssetInput,
  type Condition,
} from "@/lib/types"

const IMAGE_ACCEPT = uploadAccept("image")
const IMAGE_MAX_SIZE = UPLOAD_KINDS.image.maxSize
const DOCUMENT_ACCEPT = uploadAccept("document")
const DOCUMENT_MAX_SIZE = UPLOAD_KINDS.document.maxSize

type FormState = {
  categoryId: string
  name: string
  code: string
  serialNumber: string
  employeeId: string
  departmentId: string
  condition: Condition
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
    purchaseDate: asset.purchaseDate ?? "",
    note: asset.note ?? "",
  }
}

async function uploadFile(file: File, kind: UploadKind): Promise<string> {
  const body = new FormData()
  body.append("kind", kind)
  body.append("file", file)

  const response = await fetch("/api/files", { method: "POST", body })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? "Upload failed.")
  }
  return data.url as string
}

function resolveUrl(cleared: boolean, current: string | null | undefined) {
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
  const [formError, setFormError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    if (!form.categoryId) nextErrors.categoryId = "Category is required."
    if (!form.name.trim()) nextErrors.name = "Asset name is required."

    const code = form.code.trim()
    if (!code) {
      nextErrors.code = "Code is required."
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
      imageUrl: resolveUrl(imageCleared, asset?.imageUrl),
      docUrl: resolveUrl(docCleared, asset?.docUrl),
      recordDate: asset?.recordDate ?? today(),
      purchaseDate: form.purchaseDate || null,
      note: form.note.trim() || null,
    }

    setSaving(true)
    setFormError(null)

    try {
      if (imageFile) input.imageUrl = await uploadFile(imageFile, "image")
      if (docFile) input.docUrl = await uploadFile(docFile, "document")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed.")
      setSaving(false)
      return
    }

    try {
      if (asset) {
        await store.updateAsset(asset.id, input)
      } else {
        await store.createAsset(input)
      }
    } catch (err) {
      setErrors({ code: err instanceof Error ? err.message : "Save failed." })
      return
    } finally {
      setSaving(false)
    }

    router.push("/assets")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="space-y-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Asset Information</p>
            <p className="text-xs text-muted-foreground">
              Required fields must be filled before saving.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Category" error={errors.categoryId}>
              <Select
                items={store.categories.map((category) => ({
                  label: category.name,
                  value: String(category.id),
                }))}
                value={form.categoryId}
                onValueChange={(value) => set("categoryId", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
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

            <Field label="Condition">
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

            <Field label="Asset Name" htmlFor="asset-name" error={errors.name}>
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
              hint="Unique inventory code, e.g. AST-2026-001."
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

            <Field label="Employee">
              <Select
                items={[
                  { label: "— No holder —", value: "" },
                  ...store.employees.map((employee) => ({
                    label: employee.name,
                    value: String(employee.id),
                  })),
                ]}
                value={form.employeeId}
                onValueChange={(value) => set("employeeId", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— No holder —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— No holder —</SelectItem>
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
                  { label: "— No department —", value: "" },
                  ...departmentOptions.map((department) => ({
                    label: department.path,
                    value: String(department.id),
                  })),
                ]}
                value={form.departmentId}
                onValueChange={(value) => set("departmentId", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— No department —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— No department —</SelectItem>
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
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Notes</p>
              <Textarea
                className="min-h-24 flex-1"
                value={form.note}
                onChange={(event) => set("note", event.target.value)}
                placeholder="Special condition, repair history, or other remarks."
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium">Files</p>
              <FileUploadField
                id="asset-image"
                title="Asset Image"
                hint={uploadHint("image")}
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
                title="Supporting Document"
                hint={uploadHint("document")}
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
          </div>
        </CardContent>
      </Card>

      {formError ? (
        <p className="text-xs text-destructive">{formError}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" render={<Link href="/assets" />}>
          <X />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          <Save />
          {saving ? "Saving..." : "Save Asset"}
        </Button>
      </div>
    </form>
  )
}
