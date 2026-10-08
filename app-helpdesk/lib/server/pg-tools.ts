import { spawn } from "node:child_process"
import { access, open, readdir } from "node:fs/promises"
import path from "node:path"

import { db } from "@/lib/server/db"

export type PgConnection = {
  host: string
  port: string
  user: string
  password: string
  database: string
}

const COMMAND_TIMEOUT_MS = 300_000
const PGDMP_MAGIC = "PGDMP"
const PGDMP_HEADER_BYTES = 8

export function parseDatabaseUrl(url = process.env.DATABASE_URL): PgConnection {
  if (!url) throw new Error("DATABASE_URL is not set.")
  const parsed = new URL(url)
  const database = parsed.pathname.replace(/^\//, "")
  if (!database) throw new Error("DATABASE_URL is missing a database name.")
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  }
}

async function findWindowsBinary(name: string): Promise<string | null> {
  const base = "C:\\Program Files\\PostgreSQL"
  try {
    const versions = (await readdir(base))
      .map((entry) => Number(entry))
      .filter((value) => Number.isInteger(value))
      .sort((a, b) => b - a)
    for (const version of versions) {
      const candidate = path.join(base, String(version), "bin", `${name}.exe`)
      try {
        await access(candidate)
        return candidate
      } catch {
        continue
      }
    }
  } catch {
    // PostgreSQL is not installed in the default Windows location.
  }
  return null
}

export async function resolveBinary(
  name: "pg_dump" | "pg_restore"
): Promise<string> {
  const dir = process.env.PG_BIN_DIR
  if (dir) {
    const base = process.platform === "win32" ? `${name}.exe` : name
    return path.join(dir, base)
  }
  if (process.platform === "win32") {
    const found = await findWindowsBinary(name)
    if (found) return found
  }
  return name
}

function run(
  binary: string,
  args: string[],
  password: string
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      env: { ...process.env, PGPASSWORD: password },
      shell: false,
      windowsHide: true,
    })

    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`${path.basename(binary)} timed out after 5 minutes.`))
    }, COMMAND_TIMEOUT_MS)

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 0, stdout, stderr })
    })
  })
}

function parseMajor(version: string): number | null {
  const match = version.match(/(\d+)\./)
  return match ? Number(match[1]) : null
}

async function binaryMajorVersion(binary: string): Promise<number | null> {
  try {
    const result = await run(binary, ["--version"], "")
    if (result.code !== 0) return null
    return parseMajor(result.stdout || result.stderr)
  } catch {
    return null
  }
}

async function serverMajorVersion(): Promise<number | null> {
  const rows = await db.$queryRaw<Array<{ version: string }>>`
    SELECT current_setting('server_version') AS version
  `
  const value = rows[0]?.version
  return value ? parseMajor(value) : null
}

async function versionMismatch(
  binary: string,
  tool: "pg_dump" | "pg_restore"
): Promise<string | null> {
  const [toolMajor, serverMajor] = await Promise.all([
    binaryMajorVersion(binary),
    serverMajorVersion(),
  ])
  if (toolMajor === null || serverMajor === null || toolMajor === serverMajor) {
    return null
  }
  return (
    `${tool} versi ${toolMajor} tidak sama dengan PostgreSQL server versi ` +
    `${serverMajor}. Samakan versi PostgreSQL client tools dengan server ` +
    "(misalnya lewat PG_BIN_DIR) agar backup/restore kompatibel."
  )
}

async function archiveMismatch(
  file: string,
  binary: string
): Promise<string | null> {
  const handle = await open(file, "r")
  let minor: number | null = null
  try {
    const header = Buffer.alloc(PGDMP_HEADER_BYTES)
    const { bytesRead } = await handle.read(header, 0, PGDMP_HEADER_BYTES, 0)
    const isPgDump =
      bytesRead === PGDMP_HEADER_BYTES &&
      header.subarray(0, PGDMP_MAGIC.length).toString("latin1") === PGDMP_MAGIC &&
      header[PGDMP_MAGIC.length] === 1
    if (isPgDump) minor = header[PGDMP_MAGIC.length + 1]
  } finally {
    await handle.close()
  }

  if (minor === null) return null
  const required = minor >= 16 ? 17 : minor === 15 ? 16 : 0
  if (required === 0) return null

  const restoreMajor = await binaryMajorVersion(binary)
  if (restoreMajor === null || restoreMajor >= required) return null

  return (
    `Backup memakai format arsip PostgreSQL 1.${minor} (dibuat oleh ` +
    `PostgreSQL ${required}), sedangkan pg_restore hanya versi ${restoreMajor}. ` +
    "Samakan versi PostgreSQL client tools dengan server lalu coba lagi."
  )
}

export async function runPgDump(outFile: string): Promise<void> {
  const conn = parseDatabaseUrl()
  const binary = await resolveBinary("pg_dump")

  const mismatch = await versionMismatch(binary, "pg_dump")
  if (mismatch) throw new Error(mismatch)

  const args = [
    "-Fc",
    "--no-owner",
    "--no-privileges",
    "-h",
    conn.host,
    "-p",
    conn.port,
    "-U",
    conn.user,
    "-d",
    conn.database,
    "-f",
    outFile,
  ]
  const result = await run(binary, args, conn.password)
  if (result.code !== 0) {
    throw new Error(
      result.stderr.trim() || `pg_dump exited with code ${result.code}.`
    )
  }
}

export async function runPgRestore(
  file: string
): Promise<{ code: number; stderr: string }> {
  const conn = parseDatabaseUrl()
  const binary = await resolveBinary("pg_restore")

  const mismatch = await versionMismatch(binary, "pg_restore")
  if (mismatch) return { code: 1, stderr: mismatch }

  const unsupported = await archiveMismatch(file, binary)
  if (unsupported) return { code: 1, stderr: unsupported }

  const args = [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "-h",
    conn.host,
    "-p",
    conn.port,
    "-U",
    conn.user,
    "-d",
    conn.database,
    file,
  ]
  const result = await run(binary, args, conn.password)
  return { code: result.code, stderr: result.stderr }
}
