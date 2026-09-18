import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeInternet } from "@/lib/server/serializers"
import { internetSchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = internetSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const existing = await db.internetData.findFirst({
    where: { internetId: parsed.data.internetId, NOT: { id } },
  })
  if (existing) return fail("Internet ID is already in use.", 409)

  try {
    const item = await db.internetData.update({
      where: { id },
      data: parsed.data,
    })
    return ok(serializeInternet(item))
  } catch (error) {
    return prismaError(error, "Internet ID is already in use.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  try {
    await db.internetData.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Internet data could not be deleted.")
  }
}
