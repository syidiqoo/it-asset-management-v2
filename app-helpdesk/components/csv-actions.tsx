"use client"

import * as React from "react"
import { Download, FileUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { parseCsv } from "@/lib/csv"

const PREVIEW_ROWS = 5
const PREVIEW_CELLS = 6

export function CsvActions({
  columns,
  onExport,
  fileHint,
  note,
  onImport,
}: {
  columns: string[]
  onExport: () => void
  fileHint: string
  note: string
  onImport?: (rows: string[][]) => Promise<string>
}) {
  const [open, setOpen] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<string[][]>([])
  const [importing, setImporting] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{
    ok: boolean
    message: string
  } | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const reset = () => {
    setFileName(null)
    setRows([])
    setFeedback(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setFeedback(null)
    setRows(parseCsv(await file.text()))
  }

  const header = rows[0] ?? []
  const previewHeader = header.slice(0, PREVIEW_CELLS)
  const previewRows = rows.slice(1, PREVIEW_ROWS + 1)
  const hiddenCount = Math.max(header.length - PREVIEW_CELLS, 0)

  const handleImport = async () => {
    if (!onImport || rows.length === 0 || importing) return
    setImporting(true)
    setFeedback(null)
    try {
      const message = await onImport(rows)
      setFeedback({ ok: true, message })
      setFileName(null)
      setRows([])
      if (inputRef.current) inputRef.current.value = ""
    } catch (err) {
      setFeedback({
        ok: false,
        message: err instanceof Error ? err.message : "Import failed.",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download />
        Export CSV
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) reset()
        }}
      >
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <FileUp />
          Import CSV
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>
              Required columns: {columns.join(", ")}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label
              htmlFor="csv-file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center transition-colors hover:bg-muted/70"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-background text-muted-foreground">
                <FileUp className="size-4" />
              </div>
              <span className="text-sm font-medium wrap-break-word">
                {fileName ?? "Select CSV file"}
              </span>
              <span className="text-xs text-muted-foreground">{fileHint}</span>
              <input
                ref={inputRef}
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>

            {rows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      {previewHeader.map((cell, index) => (
                        <th
                          key={index}
                          className="h-10 max-w-32 truncate px-2 text-left align-middle text-xs font-medium whitespace-nowrap text-foreground"
                          title={cell}
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {previewRows.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        {previewHeader.map((_, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="max-w-32 truncate p-2 align-middle text-xs whitespace-nowrap"
                            title={row[cellIndex] ?? ""}
                          >
                            {row[cellIndex] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {rows.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Showing {previewRows.length} of {Math.max(rows.length - 1, 0)}{" "}
                data rows, {previewHeader.length} of {header.length} columns
                {hiddenCount > 0
                  ? ` (${hiddenCount} more hidden)`
                  : ""}
                .
              </p>
            ) : null}

            {feedback ? (
              <p
                className={
                  feedback.ok
                    ? "rounded-lg border border-emerald-600/20 bg-emerald-50 p-3 text-xs break-words text-emerald-700"
                    : "rounded-lg border border-red-600/20 bg-red-50 p-3 text-xs break-words text-red-700"
                }
              >
                {feedback.message}
              </p>
            ) : null}

            <p className="rounded-lg border bg-muted/40 p-3 text-xs break-words text-muted-foreground">
              {note}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              disabled={!onImport || rows.length === 0 || importing}
              onClick={handleImport}
            >
              <FileUp />
              {importing ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
