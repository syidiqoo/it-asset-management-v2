import { fail, ok, requireAdmin } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { createResetBackup } from "@/lib/server/reset-backup"
import { RESET_CONFIRMATION } from "@/lib/reset-data"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return fail("Unauthorized.", 401)

  const body = (await request.json().catch(() => null)) as {
    confirm?: unknown
  } | null

  if (body?.confirm !== RESET_CONFIRMATION) {
    return fail("Confirmation text does not match.", 400)
  }

  let backup: { name: string; size: number }
  try {
    backup = await createResetBackup(session.username)
  } catch (error) {
    return fail(
      error instanceof Error
        ? `Backup failed, data was not deleted: ${error.message}`
        : "Backup failed, data was not deleted.",
      500
    )
  }

  try {
    const deleted = await db.$transaction(
      async (tx) => {
        const assetFileHistory = await tx.assetFileHistory.deleteMany()
        const asset = await tx.asset.deleteMany()
        const simCard = await tx.simCard.deleteMany()
        const internetData = await tx.internetData.deleteMany()
        return {
          assetFileHistory: assetFileHistory.count,
          asset: asset.count,
          simCard: simCard.count,
          internetData: internetData.count,
        }
      },
      { timeout: 120_000, maxWait: 15_000 }
    )

    return ok({
      ok: true,
      deleted,
      backupName: backup.name,
      backupSize: backup.size,
    })
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Delete failed.")
  }
}
