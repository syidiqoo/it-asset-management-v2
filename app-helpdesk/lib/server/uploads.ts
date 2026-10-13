import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import sharp from "sharp"

const GS_TIMEOUT_MS = 30_000

function gsBinary(): string {
  if (process.env.GS_BIN) return process.env.GS_BIN
  return process.platform === "win32" ? "gswin64c" : "gs"
}

function run(binary: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { shell: false, windowsHide: true })
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`${binary} timed out.`))
    }, GS_TIMEOUT_MS)

    child.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      resolve(code ?? 1)
    })
  })
}

/**
 * Compress an image buffer to WebP.
 * Resize max 1920px wide, quality 80.
 */
export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1920, undefined, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
}

/**
 * Shrink a PDF with Ghostscript (ebook preset). Returns null when gs is
 * unavailable, fails, or the result is not smaller, so callers keep the
 * original file.
 */
export async function compressPdf(buffer: Buffer): Promise<Buffer | null> {
  const dir = await mkdtemp(join(tmpdir(), "pdf-"))
  const input = join(dir, "in.pdf")
  const output = join(dir, "out.pdf")
  try {
    await writeFile(input, buffer)
    const code = await run(gsBinary(), [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/ebook",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      `-sOutputFile=${output}`,
      input,
    ])
    if (code !== 0) return null

    const compressed = await readFile(output)
    return compressed.length < buffer.length ? compressed : null
  } catch {
    return null
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Descriptive image filename:
 * YYYYMMDD_HHmmss - nama_aset - posisi - serialnumber.webp
 */
export function buildImageFileName(
  assetName: string,
  section: string,
  serialNumber: string
): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const date =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

  const parts = [date, assetName, section, serialNumber]
    .filter(Boolean)
    .map((p) => p.replace(/[^a-zA-Z0-9_ -]/g, "").trim())

  return `${parts.join(" - ")}.webp`
}
