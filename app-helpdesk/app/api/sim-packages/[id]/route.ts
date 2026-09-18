import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializePackage } from "@/lib/server/serializers"
import { packageSchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = packageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const name = parsed.data.name
  const existing = await db.simPackage.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, NOT: { id } },
  })
  if (existing) return fail("Package name is already in use.", 409)

  try {
    const item = await db.simPackage.update({ where: { id }, data: { name } })
    return ok(serializePackage(item))
  } catch (error) {
    return prismaError(error, "Package name is already in use.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const used = await db.simCard.findFirst({ where: { packageId: id } })
  if (used) return fail("Package is still used by SIM cards.", 409)

  try {
    await db.simPackage.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Package name is already in use.")
  }
}
