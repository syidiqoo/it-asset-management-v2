import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeSimCard } from "@/lib/server/serializers"
import { simCardSchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = simCardSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const existing = await db.simCard.findFirst({
    where: { phoneNumber: parsed.data.phoneNumber, NOT: { id } },
  })
  if (existing) return fail("Phone Number is already registered.", 409)

  try {
    const item = await db.simCard.update({
      where: { id },
      data: {
        phoneNumber: parsed.data.phoneNumber,
        employeeId: parsed.data.employeeId,
        departmentId: parsed.data.departmentId,
        packageId: parsed.data.packageId,
        clsDomestic: parsed.data.clsDomestic ?? null,
        clsRoaming: parsed.data.clsRoaming ?? null,
        note: parsed.data.note ?? null,
        terminated: parsed.data.terminated,
      },
    })
    return ok(serializeSimCard(item))
  } catch (error) {
    return prismaError(error, "Phone Number is already registered.")
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
    await db.simCard.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "SIM card could not be deleted.")
  }
}
