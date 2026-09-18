import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeEmployee } from "@/lib/server/serializers"
import { employeeSchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = employeeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  try {
    const item = await db.employee.update({
      where: { id },
      data: { name: parsed.data.name, departmentId: parsed.data.departmentId },
    })
    return ok(serializeEmployee(item))
  } catch (error) {
    return prismaError(error, "Employee could not be updated.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  if (await db.asset.findFirst({ where: { employeeId: id } })) {
    return fail("Employee still holds assets.", 409)
  }
  if (await db.simCard.findFirst({ where: { employeeId: id } })) {
    return fail("Employee still holds SIM cards.", 409)
  }

  try {
    await db.employee.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Employee could not be deleted.")
  }
}
