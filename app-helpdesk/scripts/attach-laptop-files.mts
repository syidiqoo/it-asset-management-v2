import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const SAMPLE_ROOT = path.resolve("sample-import/LAPTOP-20261014T111838Z-1-001/LAPTOP")
const USERNAME = process.env.ADMIN_USERNAME ?? "admin"
const PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123"
const REPORT_PATH =
  process.env.REPORT_PATH ??
  path.join(process.env.COMMANDCODE_SCRATCHPAD ?? ".", "attach-report.json")
const DRY = process.argv.includes("--dry")
const limitArg = process.argv.find((item) => item.startsWith("--limit="))
const LIMIT = limitArg ? Number(limitArg.slice("--limit=".length)) : Number.POSITIVE_INFINITY
const MAX_SIZE = 2 * 1024 * 1024
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png"])
const SIGNED_PREFIX = /^\s*(\[?UNSIGNED\]?|\[?SIGNED\]?)\s*/i

type Candidate = {
  file: string
  name: string
  date: number
  size: number
}

type AssetItem = {
  id: number
  categoryId: number
  name: string
  code: string
  serialNumber: string | null
  employeeId: number | null
  departmentId: number | null
  condition: string
  outStatus: string | null
  imageUrl: string | null
  docUrl: string | null
  purchaseDate: string | null
  note: string | null
}

type Attachment = { file: string; date: string; size: number } | null

type Result = {
  serial: string
  assetId: number | null
  code: string | null
  image: Attachment
  doc: Attachment
  status: "updated" | "skipped" | "failed"
  detail: string
}

type Issue = { serial: string; type: string; detail: string }

function parseDate(raw: string): number {
  const match = raw.match(/^(\d{6,9})/)
  if (!match) return Number.NaN
  const digits = match[1]
  const dmy = (value: string) => {
    const dd = Number(value.slice(0, 2))
    const mm = Number(value.slice(2, 4))
    const yyyy = Number(value.slice(4, 8))
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900 || yyyy > 2200) return Number.NaN
    return Date.UTC(yyyy, mm - 1, dd)
  }
  const ymd = (value: string) => {
    const yyyy = Number(value.slice(0, 4))
    const mm = Number(value.slice(4, 6))
    const dd = Number(value.slice(6, 8))
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900 || yyyy > 2200) return Number.NaN
    return Date.UTC(yyyy, mm - 1, dd)
  }
  if (digits.length === 8) {
    const value = dmy(digits)
    return Number.isNaN(value) ? ymd(digits) : value
  }
  if (digits.length === 7) return dmy(`0${digits}`)
  return Number.NaN
}

function toCandidate(file: string): Candidate {
  const name = path.basename(file)
  const stat = statSync(file)
  const parsed = parseDate(name.replace(SIGNED_PREFIX, ""))
  return {
    file,
    name,
    date: Number.isNaN(parsed) ? stat.mtimeMs : parsed,
    size: stat.size,
  }
}

function newest(items: Candidate[]): Candidate | undefined {
  return [...items].sort((a, b) => b.date - a.date || a.name.localeCompare(b.name))[0]
}

function isUnsigned(name: string): boolean {
  return /UNSIGNED/i.test(name)
}

const SERIAL_TOKEN = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{6,}$/

function serialTokens(name: string): string[] {
  return name
    .replace(/\.[A-Za-z0-9]+$/, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((token) => SERIAL_TOKEN.test(token))
}

function serialMismatch(name: string, serial: string): string | null {
  const upper = serial.toUpperCase()
  const tokens = serialTokens(name)
  if (tokens.length === 0) return null
  const matched = tokens.some(
    (token) => token === upper || token.endsWith(upper) || upper.endsWith(token)
  )
  return matched ? null : tokens[0]
}

function pick(
  items: Candidate[],
  folderSerial: string,
  kind: "image" | "doc",
  issues: Issue[]
): Candidate | undefined {
  let pool = items
  const matched = pool.filter((item) => !serialMismatch(item.name, folderSerial))
  if (matched.length > 0 && matched.length < pool.length) {
    for (const item of pool) {
      const token = serialMismatch(item.name, folderSerial)
      if (token) issues.push({ serial: folderSerial, type: `${kind}-serial-beda`, detail: `${item.name} (token ${token})` })
    }
    pool = matched
  }
  if (kind === "doc") {
    const signed = pool.filter((item) => !isUnsigned(item.name))
    if (signed.length > 0 && signed.length < pool.length) {
      issues.push({ serial: folderSerial, type: "dokumen-unsigned-dilewati", detail: `${pool.length - signed.length} file [UNSIGNED]` })
      pool = signed
    }
  }
  return newest(pool)
}

function scanFolder(serial: string) {
  const dir = path.join(SAMPLE_ROOT, serial)
  const subs = readdirSync(dir, { withFileTypes: true }).filter((item) => item.isDirectory())
  const imageDir = subs.find((item) => /^images?$/i.test(item.name))
  const bastDir = subs.find((item) => /^bast$/i.test(item.name))
  const images: Candidate[] = []
  const docs: Candidate[] = []
  const issues: Issue[] = []

  const collect = (base: string | undefined, kind: "image" | "doc") => {
    if (!base) return
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name).toLowerCase()
      const isImage = IMAGE_EXT.has(ext)
      const isPdf = ext === ".pdf"
      if (kind === "image" ? isImage : isPdf) {
        const candidate = toCandidate(path.join(base, entry.name))
        if (kind === "image") images.push(candidate)
        else docs.push(candidate)
      } else if (!isImage && !isPdf) {
        issues.push({ serial, type: "file-non-gambar-pdf", detail: path.basename(path.dirname(base)) + "/" + entry.name })
      }
    }
  }

  collect(imageDir ? path.join(dir, imageDir.name) : undefined, "image")
  collect(bastDir ? path.join(dir, bastDir.name) : undefined, "doc")

  if (bastDir) {
    const base = path.join(dir, bastDir.name)
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (entry.isFile() && IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
        images.push(toCandidate(path.join(base, entry.name)))
        issues.push({ serial, type: "gambar-di-folder-bast", detail: entry.name })
      }
    }
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile()) {
      issues.push({ serial, type: "file-di-root-folder", detail: entry.name })
    }
  }

  if (imageDir && imageDir.name !== "Images") {
    issues.push({ serial, type: "nama-folder-gambar", detail: imageDir.name })
  }

  return { serial, images, docs, issues }
}

let cookie = ""

async function login() {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  })
  if (!response.ok) throw new Error(`login gagal (${response.status})`)
  const setCookies =
    typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : []
  const raw = setCookies.length > 0 ? setCookies : [response.headers.get("set-cookie") ?? ""]
  cookie = raw.map((item) => item.split(";")[0]).filter(Boolean).join("; ")
  if (!cookie) throw new Error("cookie sesi tidak diterima")
}

async function fetchAssets(): Promise<AssetItem[]> {
  const response = await fetch(`${BASE}/api/assets`, { headers: { cookie } })
  if (!response.ok) throw new Error(`GET /api/assets gagal (${response.status})`)
  return (await response.json()) as AssetItem[]
}

async function uploadFile(
  kind: "image" | "document",
  candidate: Candidate,
  meta: { assetName: string; serialNumber: string }
): Promise<string> {
  const body = new FormData()
  body.append("kind", kind)
  body.append(
    "file",
    new File([readFileSync(candidate.file)], candidate.name, {
      type: kind === "image" ? "image/jpeg" : "application/pdf",
    })
  )
  if (kind === "image") {
    body.append("assetName", meta.assetName)
    body.append("section", "Laptop")
    body.append("serialNumber", meta.serialNumber)
  }
  const response = await fetch(`${BASE}/api/files`, {
    method: "POST",
    headers: { cookie },
    body,
  })
  const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null
  if (!response.ok || !data?.url) {
    throw new Error(data?.error ?? `upload ${kind} gagal (${response.status})`)
  }
  return data.url
}

async function updateAsset(item: AssetItem, imageUrl: string | null, docUrl: string | null) {
  const body = {
    categoryId: item.categoryId,
    name: item.name,
    code: item.code,
    serialNumber: item.serialNumber || null,
    employeeId: item.employeeId ?? null,
    departmentId: item.departmentId ?? null,
    condition: item.condition,
    outStatus: item.outStatus || null,
    imageUrl,
    docUrl,
    purchaseDate: item.purchaseDate || null,
    note: item.note || null,
  }
  const response = await fetch(`${BASE}/api/assets/${item.id}`, {
    method: "PUT",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `PUT asset gagal (${response.status})`)
  }
}

function describe(candidate: Candidate | undefined): Attachment {
  if (!candidate) return null
  return {
    file: path.basename(candidate.file),
    date: new Date(candidate.date).toISOString().slice(0, 10),
    size: candidate.size,
  }
}

async function main() {
  await login()
  const assets = await fetchAssets()

  const bySerial = new Map<string, AssetItem[]>()
  for (const item of assets) {
    const key = (item.serialNumber ?? "").trim().toUpperCase()
    if (!key) continue
    const list = bySerial.get(key) ?? []
    list.push(item)
    bySerial.set(key, list)
  }

  const issues: Issue[] = []
  for (const [key, list] of bySerial) {
    if (list.length > 1) {
      issues.push({ serial: key, type: "serial-duplikat", detail: list.map((item) => item.code).join(", ") })
    }
  }

  const serials = readdirSync(SAMPLE_ROOT, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)

  const results: Result[] = []
  let processed = 0

  for (const serial of serials) {
    const folder = scanFolder(serial)
    issues.push(...folder.issues)

    const matches = bySerial.get(serial.toUpperCase())
    if (!matches || matches.length === 0) {
      results.push({
        serial,
        assetId: null,
        code: null,
        image: describe(newest(folder.images)),
        doc: describe(newest(folder.docs)),
        status: "skipped",
        detail: "folder tanpa data aset",
      })
      continue
    }
    if (matches.length > 1) {
      results.push({
        serial,
        assetId: null,
        code: null,
        image: null,
        doc: null,
        status: "skipped",
        detail: `serial duplikat di ${matches.length} aset`,
      })
      continue
    }
    if (processed >= LIMIT) {
      results.push({ serial, assetId: matches[0].id, code: matches[0].code, image: null, doc: null, status: "skipped", detail: "di luar batas --limit" })
      continue
    }

    const asset = matches[0]
    const imageCandidate = pick(folder.images, serial, "image", issues)
    const docCandidate = pick(folder.docs, serial, "doc", issues)

    const image = describe(imageCandidate)
    const doc = describe(docCandidate)

    const problems: string[] = []
    if (imageCandidate && imageCandidate.size > MAX_SIZE) problems.push(`gambar ${Math.round(imageCandidate.size / 1024 / 1024)}MB > 2MB`)
    if (docCandidate && docCandidate.size > MAX_SIZE) problems.push(`dokumen ${Math.round(docCandidate.size / 1024 / 1024)}MB > 2MB`)

    if (!imageCandidate && !docCandidate) {
      results.push({ serial, assetId: asset.id, code: asset.code, image, doc, status: "skipped", detail: "tidak ada gambar maupun dokumen" })
      continue
    }
    if (problems.length > 0) {
      results.push({ serial, assetId: asset.id, code: asset.code, image, doc, status: "failed", detail: problems.join("; ") })
      continue
    }

    if (DRY) {
      results.push({ serial, assetId: asset.id, code: asset.code, image, doc, status: "updated", detail: "dry-run" })
      processed += 1
      continue
    }

    try {
      const imageUrl = imageCandidate
        ? await uploadFile("image", imageCandidate, {
            assetName: asset.name,
            serialNumber: asset.serialNumber ?? serial,
          })
        : asset.imageUrl
      const docUrl = docCandidate ? await uploadFile("document", docCandidate, { assetName: asset.name, serialNumber: asset.serialNumber ?? serial }) : asset.docUrl
      await updateAsset(asset, imageUrl, docUrl)
      results.push({ serial, assetId: asset.id, code: asset.code, image, doc, status: "updated", detail: "ok" })
      processed += 1
      console.log(`ok   ${serial} (asset ${asset.id})${image ? " img" : ""}${doc ? " doc" : ""}`)
    } catch (error) {
      results.push({
        serial,
        assetId: asset.id,
        code: asset.code,
        image,
        doc,
        status: "failed",
        detail: error instanceof Error ? error.message : "unknown error",
      })
      console.log(`FAIL ${serial} (asset ${asset.id}): ${error instanceof Error ? error.message : error}`)
    }
  }

  const summary = {
    folders: serials.length,
    assetsTotal: assets.length,
    processed,
    updated: results.filter((item) => item.status === "updated").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    failed: results.filter((item) => item.status === "failed").length,
    issues: issues.length,
    dryRun: DRY,
  }

  writeFileSync(
    REPORT_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, issues, results }, null, 2)
  )

  console.log("\n=== SUMMARY ===")
  console.log(JSON.stringify(summary, null, 2))
  console.log("\n--- dilewati ---")
  for (const item of results.filter((entry) => entry.status === "skipped")) {
    console.log(`  ${item.serial}: ${item.detail}`)
  }
  console.log("\n--- gagal ---")
  for (const item of results.filter((entry) => entry.status === "failed")) {
    console.log(`  ${item.serial}: ${item.detail}`)
  }
  console.log(`\nreport: ${REPORT_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
