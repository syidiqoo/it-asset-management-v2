import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeCategory } from "@/lib/server/serializers"
import { categorySchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = categorySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const name = parsed.data.name
  const existing = await db.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, NOT: { id } },
  })
  if (existing) return fail("Category name is already in use.", 409)

  try {
    const item = await db.category.update({ where: { id }, data: { name } })
    return ok(serializeCategory(item))
  } catch (error) {
    return prismaError(error, "Category name is already in use.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const used = await db.asset.findFirst({ where: { categoryId: id } })
  if (used) return fail("Category is still used by assets.", 409)

  try {
    await db.category.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Category name is already in use.")
  }
}
