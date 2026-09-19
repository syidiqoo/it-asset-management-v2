// Excel in some locales exports "CSV" with semicolons, so the separator is
// detected from the header line instead of assuming a comma.
function detectDelimiter(text: string): string {
  const firstLine = text.split("\n", 1)[0] ?? ""
  const semicolons = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return semicolons > commas ? ";" : ","
}

function tokenize(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") {
      field += char
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function unwrapRow(
  row: string[],
  columns: number,
  delimiter: string
): string[] {
  if (columns < 2 || row.length !== 1) return row
  const nested = tokenize(row[0], delimiter)
  if (nested.length === 1 && nested[0].length === columns) return nested[0]
  return row
}

export function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const delimiter = detectDelimiter(text)
  const rows = tokenize(text, delimiter)
  const columns = rows[0]?.length ?? 0
  return rows
    .map((row) => unwrapRow(row, columns, delimiter))
    .filter((item) => item.some((cell) => cell.trim() !== ""))
}

export function csvFileName(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`
}

export function downloadCsv(
  fileName: string,
  header: string[],
  rows: string[][]
): void {
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\r\n")

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
