"use client"

import * as React from "react"
import { FileText, ImageIcon, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/format"

function extensionOf(fileName: string) {
  const index = fileName.lastIndexOf(".")
  return index === -1 ? "" : fileName.slice(index).toLowerCase()
}

export function FileUploadField({
  id,
  title,
  hint,
  accept,
  maxSize,
  kind,
  initialUrl,
  onFileChange,
}: {
  id: string
  title: string
  hint: string
  accept: string
  maxSize: number
  kind: "image" | "document"
  initialUrl?: string | null
  onFileChange: (file: File | null) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    initialUrl ?? null
  )
  const [error, setError] = React.useState<string | null>(null)

  const handleFile = (selected: File | undefined) => {
    if (!selected) return

    const allowed = accept
      .split(",")
      .map((item) => item.trim().toLowerCase())

    if (!allowed.includes(extensionOf(selected.name))) {
      setError(`Format berkas tidak didukung. Gunakan ${accept}.`)
      return
    }
    if (selected.size > maxSize) {
      setError(`Ukuran berkas melebihi batas ${formatFileSize(maxSize)}.`)
      return
    }

    setError(null)
    setFile(selected)
    if (kind === "image") setPreviewUrl(URL.createObjectURL(selected))
    onFileChange(selected)
  }

  const clear = () => {
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
    onFileChange(null)
  }

  const hasContent = Boolean(previewUrl || file)

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          Pilih berkas
        </Button>
      </div>

      {hasContent ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          {kind === "image" && previewUrl ? (
            <div
              role="img"
              aria-label="Pratinjau gambar"
              className="size-16 shrink-0 rounded-md border bg-muted bg-cover bg-center"
              style={{ backgroundImage: `url(${previewUrl})` }}
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
              <FileText className="size-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {file ? file.name : "Berkas terlampir"}
            </p>
            <p className="text-xs text-muted-foreground">
              {file ? formatFileSize(file.size) : "Tersimpan"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus ${title}`}
            onClick={clear}
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
          <ImageIcon className="size-4" />
          Belum ada berkas dipilih.
        </div>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
