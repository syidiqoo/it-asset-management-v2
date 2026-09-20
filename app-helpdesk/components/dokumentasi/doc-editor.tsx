"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImagePlus, Save, X } from "lucide-react"

import { Markdown } from "@/components/dokumentasi/markdown"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/docs"
import type { Doc } from "@/lib/types"
import { uploadAccept, uploadFile, uploadHint } from "@/lib/uploads"

type FormState = {
  title: string
  slug: string
  summary: string
  content: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
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

export function DocEditor({ doc }: { doc?: Doc }) {
  const router = useRouter()
  const [form, setForm] = React.useState<FormState>({
    title: doc?.title ?? "",
    slug: doc?.slug ?? "",
    summary: doc?.summary ?? "",
    content: doc?.content ?? "",
  })
  // On a new document the slug follows the title until the author edits it.
  const [slugEdited, setSlugEdited] = React.useState(Boolean(doc))
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const contentRef = React.useRef<HTMLTextAreaElement>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const set = <Key extends keyof FormState>(key: Key, value: FormState[Key]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const onTitleChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      title: value,
      slug: slugEdited ? previous.slug : slugify(value),
    }))
  }

  const insertImage = async (file: File | undefined) => {
    if (!file) return

    setFormError(null)
    setUploading(true)
    try {
      const url = await uploadFile(file, "image")
      const snippet = `![${file.name}](${url})`
      const textarea = contentRef.current

      if (!textarea) {
        set("content", `${form.content}\n\n${snippet}`)
        return
      }

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      set(
        "content",
        `${form.content.slice(0, start)}${snippet}${form.content.slice(end)}`
      )
      requestAnimationFrame(() => {
        textarea.focus()
        const caret = start + snippet.length
        textarea.setSelectionRange(caret, caret)
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    const title = form.title.trim()
    const slug = form.slug.trim()
    const content = form.content.trim()

    if (!title) nextErrors.title = "Title is required."
    if (!slug) nextErrors.slug = "Slug is required."
    else if (!SLUG_PATTERN.test(slug))
      nextErrors.slug =
        "Slug can only contain lowercase letters, numbers, and dashes."
    if (!content) nextErrors.content = "Content is required."

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setFormError(null)
    setSaving(true)

    try {
      const response = await fetch(doc ? `/api/docs/${doc.id}` : "/api/docs", {
        method: doc ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          summary: form.summary.trim() || null,
          content,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message = (data?.error as string) ?? "Save failed."
        if (response.status === 409) setErrors({ slug: message })
        else setFormError(message)
        return
      }

      router.push(`/dokumentasi/${data.slug}`)
      router.refresh()
    } catch {
      setFormError("Save failed.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit text-muted-foreground"
          render={<Link href="/dokumentasi" />}
        >
          <ArrowLeft />
          Dokumentasi
        </Button>

        <PageHeader
          title={doc ? "Edit Document" : "New Document"}
          description="Tulis dokumentasi dalam format Markdown. Perubahan belum tersimpan sampai kamu menekan Save."
        />

        <Card size="sm">
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field
              label="Title"
              htmlFor="doc-title"
              error={errors.title}
              hint="Judul yang tampil di daftar dan halaman dokumen."
            >
              <Input
                id="doc-title"
                value={form.title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="Topologi Internet Kantor"
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="doc-slug"
              error={errors.slug}
              hint="Alamat URL dokumen. Terisi otomatis dari judul, bisa diubah."
            >
              <Input
                id="doc-slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true)
                  set("slug", event.target.value)
                }}
                placeholder="topologi-internet-kantor"
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Summary"
                htmlFor="doc-summary"
                error={errors.summary}
                hint="Opsional. Satu baris ringkasan untuk daftar dokumentasi."
              >
                <Input
                  id="doc-summary"
                  value={form.summary}
                  onChange={(event) => set("summary", event.target.value)}
                  placeholder="Ringkasan singkat isi dokumen."
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card size="sm">
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="doc-content">Content</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept={uploadAccept("image")}
                  className="sr-only"
                  onChange={(event) => insertImage(event.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus />
                  {uploading ? "Uploading..." : "Insert image"}
                </Button>
              </div>
              <Textarea
                id="doc-content"
                ref={contentRef}
                value={form.content}
                spellCheck={false}
                onChange={(event) => set("content", event.target.value)}
                placeholder={"## Ringkasan\n\nTulis di sini..."}
                className="min-h-96 font-mono text-xs leading-6"
              />
              {errors.content ? (
                <p className="text-xs text-destructive">{errors.content}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {uploadHint("image")} — unggah hasil export draw.io lewat
                  Insert image untuk menyisipkannya sebagai gambar.
                </p>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent className="space-y-2">
              <Label>Preview</Label>
              <div className="min-h-96 rounded-lg border px-4 py-1">
                {form.content.trim() ? (
                  <Markdown content={form.content} />
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Belum ada isi untuk ditampilkan.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t p-4 md:p-6">
        {formError ? (
          <p className="mr-auto text-xs text-destructive">{formError}</p>
        ) : null}
        <Button variant="outline" render={<Link href="/dokumentasi" />}>
          <X />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          <Save />
          {saving ? "Saving..." : "Save Document"}
        </Button>
      </div>
    </form>
  )
}
