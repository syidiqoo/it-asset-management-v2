import { fail, ok, requireAdmin } from "@/lib/server/api"
import { createBackup, listBackups } from "@/lib/server/db-backup-store"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET() {
  if (!(await requireAdmin())) return fail("Unauthorized.", 401)
  try {
    return ok(await listBackups())
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to list backups.",
      500
    )
  }
}

export async function POST() {
  if (!(await requireAdmin())) return fail("Unauthorized.", 401)
  try {
    return ok(await createBackup("backup"))
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Backup failed.", 500)
  }
}
