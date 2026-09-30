import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializePosition } from "@/lib/server/serializers"
import { positionSchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = positionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { name, departmentId } = parsed.data

  if (departmentId !== null) {
    const department = await db.department.findUnique({
      where: { id: departmentId },
    })
    if (!department) return fail("Department not found.", 400)
  }

  const existing = await db.position.findFirst({
    where: {
      name: name,
      departmentId: departmentId,
      id: { not: id },
    },
  })
  if (existing) {
    return fail("Position name is already used in that department.", 409)
  }

  try {
    const item = await db.position.update({
      where: { id },
      data: { name, departmentId },
    })
    return ok(serializePosition(item))
  } catch (error) {
    return prismaError(error, "Position could not be updated.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  if (await db.employee.findFirst({ where: { positionId: id } })) {
    return fail("Position is still used by employees.", 409)
  }

  try {
    await db.position.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Position could not be deleted.")
  }
}
