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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { parseCsv } from "@/lib/csv"

const PREVIEW_ROWS = 5

export function CsvActions({
  columns,
  onExport,
  fileHint,
  note,
}: {
  columns: string[]
  onExport: () => void
  fileHint: string
  note: string
}) {
  const [open, setOpen] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<string[][]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)

  const reset = () => {
    setFileName(null)
    setRows([])
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setRows(parseCsv(await file.text()))
  }

  const previewRows = rows.slice(1, PREVIEW_ROWS + 1)

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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>
              Kolom yang dibutuhkan: {columns.join(", ")}.
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
              <span className="text-sm font-medium">
                {fileName ?? "Pilih berkas CSV"}
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
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="text-xs">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((_, cellIndex) => (
                          <TableCell key={cellIndex} className="text-xs">
                            {row[cellIndex] ?? ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {rows.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Menampilkan {previewRows.length} dari {Math.max(rows.length - 1, 0)}{" "}
                baris data.
              </p>
            ) : null}

            <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              {note}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Tutup
            </Button>
            <Button disabled>
              <FileUp />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
