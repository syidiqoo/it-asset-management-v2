"use client"

import * as React from "react"
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
} from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { parseCsv } from "@/lib/csv"
import {
  downloadPdfReport,
  type PdfExportData,
} from "@/lib/report"

const PREVIEW_ROWS = 5
const PREVIEW_CELLS = 6

export type PdfExport = PdfExportData

export function CsvActions({
  columns,
  onExport,
  fileHint,
  note,
  onImport,
  pdf,
}: {
  columns: string[]
  onExport: () => void
  fileHint: string
  note: string
  onImport?: (rows: string[][]) => Promise<string>
  pdf?: PdfExport
}) {
  const [open, setOpen] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<string[][]>([])
  const [importing, setImporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const reset = () => {
    setFileName(null)
    setRows([])
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setError(null)
    setRows(parseCsv(await file.text()))
  }

  const header = rows[0] ?? []
  const previewHeader = header.slice(0, PREVIEW_CELLS)
  const previewRows = rows.slice(1, PREVIEW_ROWS + 1)
  const hiddenCount = Math.max(header.length - PREVIEW_CELLS, 0)

  const handleExportPdf = () => {
    if (!pdf) return
    downloadPdfReport(pdf)
  }

  const handleImport = async () => {
    if (!onImport || rows.length === 0 || importing) return
    setImporting(true)
    setError(null)
    try {
      const message = await onImport(rows)
      setOpen(false)
      reset()
      toast.success(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      {pdf ? (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Download />
            Export
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleExportPdf}>
              <FileText />
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <FileSpreadsheet />
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download />
          Export CSV
        </Button>
      )}

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
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewHeader.map((cell, index) => (
                      <TableHead
                        key={index}
                        className="max-w-32 truncate text-xs"
                        title={cell}
                      >
                        {cell}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, index) => (
                    <TableRow key={index}>
                      {previewHeader.map((_, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          className="max-w-32 truncate text-xs"
                          title={row[cellIndex] ?? ""}
                        >
                          {row[cellIndex] ?? ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

            {error ? (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
