import { readFile, unlink } from "node:fs/promises"

import { fail, ok, requireAdmin } from "@/lib/server/api"
import { backupFilePath, isValidBackupName } from "@/lib/server/db-backup-store"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  if (!(await requireAdmin())) return fail("Unauthorized.", 401)

  const name = (await params).name
  if (!isValidBackupName(name)) return fail("Invalid backup name.", 400)

  try {
    const file = await readFile(backupFilePath(name))
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Length": String(file.byteLength),
      },
    })
  } catch {
    return fail("Backup not found.", 404)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  if (!(await requireAdmin())) return fail("Unauthorized.", 401)

  const name = (await params).name
  if (!isValidBackupName(name)) return fail("Invalid backup name.", 400)

  try {
    await unlink(backupFilePath(name))
    return ok({ ok: true })
  } catch {
    return fail("Backup not found.", 404)
  }
}
