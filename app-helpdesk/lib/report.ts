import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export type PdfColumn = {
  header: string
  align?: "left" | "center" | "right"
}

export type PdfExportData = {
  title: string
  columns: PdfColumn[]
  rows: string[][]
  filePrefix: string
}

export function reportFileName(prefix: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix} - ${date}.${extension}`
}

const timestampFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const ALIGN: Record<NonNullable<PdfColumn["align"]>, "left" | "center" | "right"> = {
  left: "left",
  center: "center",
  right: "right",
}

export function downloadPdfReport(data: PdfExportData): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text(data.title, pageWidth / 2, 14, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(
    `Dicetak ${timestampFormatter.format(new Date())} · ${data.rows.length} data`,
    pageWidth / 2,
    20,
    { align: "center" }
  )

  autoTable(doc, {
    startY: 25,
    head: [["No", ...data.columns.map((column) => column.header)]],
    body: data.rows.map((row, index) => [
      String(index + 1),
      ...row.map((cell) => cell || "—"),
    ]),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 41, 59], halign: "center" },
    columnStyles: Object.fromEntries(
      data.columns.map((column, index) => [
        index + 1,
        { halign: ALIGN[column.align ?? "left"] },
      ])
    ),
  })

  doc.save(reportFileName(data.filePrefix, "pdf"))
}
