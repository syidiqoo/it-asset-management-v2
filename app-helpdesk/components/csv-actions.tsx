"use client"

import * as React from "react"
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
} from "lucide-react"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import { toast } from "sonner"
import { parseCsv } from "@/lib/csv"
import { downloadPdfReport, type PdfExportData } from "@/lib/report"

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
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null)
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

  const handleClose = () => {
    setOpen(false)
    reset()
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
        <>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download className="size-4" />}
            endIcon={<ChevronDown className="size-4" />}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            Export
          </Button>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                handleExportPdf()
              }}
            >
              <FileText className="mr-2 size-4" />
              Export PDF
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                onExport()
              }}
            >
              <FileSpreadsheet className="mr-2 size-4" />
              Export CSV
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download className="size-4" />}
          onClick={onExport}
        >
          Export CSV
        </Button>
      )}

      <Button
        variant="outlined"
        size="small"
        startIcon={<FileUp className="size-4" />}
        onClick={() => setOpen(true)}
      >
        Import CSV
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="body"
      >
        <DialogTitle>Import CSV</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Required columns: {columns.join(", ")}.
          </DialogContentText>

          <div className="mt-3 space-y-3">
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {previewHeader.map((cell, index) => (
                      <TableCell
                        key={index}
                        className="max-w-32 truncate text-xs"
                        title={cell}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
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
                {hiddenCount > 0 ? ` (${hiddenCount} more hidden)` : ""}.
              </p>
            ) : null}

            {error ? <Alert severity="error">{error}</Alert> : null}

            <p className="rounded-lg border bg-muted/40 p-3 text-xs break-words text-muted-foreground">
              {note}
            </p>
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<FileUp className="size-4" />}
            disabled={!onImport || rows.length === 0 || importing}
            onClick={handleImport}
          >
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
