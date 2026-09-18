"use client"

import * as React from "react"
import { FileText, ImageIcon, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/format"
import { fileExtension } from "@/lib/uploads"

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

    if (!allowed.includes(fileExtension(selected.name))) {
      setError(`Unsupported file format. Use ${accept}.`)
      return
    }
    if (selected.size > maxSize) {
      setError(`File exceeds ${formatFileSize(maxSize)} limit.`)
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
          Choose file
        </Button>
      </div>

      {hasContent ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          {kind === "image" && previewUrl ? (
            <div
              role="img"
              aria-label="Image preview"
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
              {file ? file.name : "Attached file"}
            </p>
            <p className="text-xs text-muted-foreground">
              {file ? formatFileSize(file.size) : "Saved"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${title}`}
            onClick={clear}
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
          <ImageIcon className="size-4" />
          No file selected yet.
        </div>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
