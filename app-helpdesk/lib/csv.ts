export function parseCsv(text: string): string[][] {
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
    } else if (char === ",") {
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

  return rows.filter((item) => item.some((cell) => cell.trim() !== ""))
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
