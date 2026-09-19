import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeLocation } from "@/lib/server/serializers"
import { locationSchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = locationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { code, address, detailStreetAddress, latitude, longitude } =
    parsed.data
  const existing = await db.location.findFirst({
    where: { code, NOT: { id } },
  })
  if (existing) return fail(`Code ${code} is already used by another location.`, 409)

  try {
    const item = await db.location.update({
      where: { id },
      data: { code, address, detailStreetAddress, latitude, longitude },
    })
    return ok(serializeLocation(item))
  } catch (error) {
    return prismaError(error, `Code ${code} is already used by another location.`)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  if (await db.internetData.findFirst({ where: { locationId: id } })) {
    return fail("Location is still used by internet data.", 409)
  }

  try {
    await db.location.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Location could not be deleted.")
  }
}
