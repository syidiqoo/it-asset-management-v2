import { unlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { RESTORE_CONFIRMATION } from "@/lib/db-backup"
import { fail, ok, requireAdmin } from "@/lib/server/api"
import { backupFilePath, createBackup, isValidBackupName } from "@/lib/server/db-backup-store"
import { db } from "@/lib/server/db"
import { runPgRestore } from "@/lib/server/pg-tools"

export const runtime = "nodejs"
export const maxDuration = 300

const PGDMP_MAGIC = "PGDMP"

async function restoreFrom(file: string, source: string) {
  let preRestore: { name: string }
  try {
    preRestore = await createBackup("pre-restore")
  } catch (error) {
    return fail(
      error instanceof Error
        ? `Pre-restore backup failed, database was not changed: ${error.message}`
        : "Pre-restore backup failed, database was not changed.",
      500
    )
  }

  const result = await runPgRestore(file)
  if (result.code !== 0) {
    return fail(
      result.stderr.trim() || `pg_restore exited with code ${result.code}.`,
      500
    )
  }

  await db.$disconnect()
  return ok({ ok: true, restoredFrom: source, preRestoreBackup: preRestore.name })
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail("Unauthorized.", 401)

  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null)
    if (!form) return fail("Invalid form data.", 400)

    const confirm = String(form.get("confirm") ?? "")
    if (confirm !== RESTORE_CONFIRMATION) {
      return fail("Confirmation text does not match.", 400)
    }

    const file = form.get("file")
    if (!(file instanceof File)) return fail("Backup file is required.", 400)

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.subarray(0, PGDMP_MAGIC.length).toString("latin1") !== PGDMP_MAGIC) {
      return fail("File is not a valid pg_dump custom backup.", 400)
    }

    const tempFile = path.join(os.tmpdir(), `restore-upload-${Date.now()}.dump`)
    await writeFile(tempFile, buffer)
    try {
      return await restoreFrom(tempFile, file.name)
    } finally {
      await unlink(tempFile).catch(() => {})
    }
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown
    confirm?: unknown
  } | null

  if (body?.confirm !== RESTORE_CONFIRMATION) {
    return fail("Confirmation text does not match.", 400)
  }
  if (typeof body.name !== "string" || !isValidBackupName(body.name)) {
    return fail("Invalid backup name.", 400)
  }

  return restoreFrom(backupFilePath(body.name), body.name)
}
