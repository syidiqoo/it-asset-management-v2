import { readFile } from "node:fs/promises"
import path from "node:path"

import { fail, requireAdmin } from "@/lib/server/api"
import { backupDirectory, isValidBackupName } from "@/lib/server/reset-backup"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  if (!(await requireAdmin())) return fail("Unauthorized.", 401)

  const name = (await params).name
  if (!isValidBackupName(name)) return fail("Invalid backup name.", 400)

  try {
    const file = await readFile(path.join(backupDirectory(), name))
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Length": String(file.byteLength),
      },
    })
  } catch {
    return fail("Backup not found.", 404)
  }
}
