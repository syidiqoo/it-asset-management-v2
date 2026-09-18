import { fail, ok, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { applyAssetImport } from "@/lib/server/import"
import { importRowsSchema, zodMessage } from "@/lib/server/validators"

export async function POST(request: Request) {
  const session = await requireUser()
  if (!session) return fail("Unauthorized.", 401)
  const parsed = importRowsSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) return fail(zodMessage(parsed.error))

  try {
    const result = await db.$transaction(
      (tx) => applyAssetImport(tx, parsed.data.rows, session.name),
      { timeout: 120_000, maxWait: 15_000 }
    )
    return ok(result)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Import failed.")
  }
}
