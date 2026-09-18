import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeAsset } from "@/lib/server/serializers"
import { assetSchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser()
  if (!session) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = assetSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const existing = await db.asset.findFirst({
    where: {
      code: { equals: parsed.data.code, mode: "insensitive" },
      NOT: { id },
    },
  })
  if (existing) return fail("Code is already used by another asset.", 409)

  try {
    const item = await db.asset.update({
      where: { id },
      data: {
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        code: parsed.data.code,
        serialNumber: parsed.data.serialNumber ?? null,
        employeeId: parsed.data.employeeId,
        departmentId: parsed.data.departmentId,
        condition: parsed.data.condition,
        imageUrl: parsed.data.imageUrl ?? null,
        docUrl: parsed.data.docUrl ?? null,
        purchaseDate: parsed.data.purchaseDate
          ? new Date(`${parsed.data.purchaseDate}T00:00:00Z`)
          : null,
        note: parsed.data.note ?? null,
        updatedBy: session.name,
      },
    })
    return ok(serializeAsset(item))
  } catch (error) {
    return prismaError(error, "Code is already used by another asset.")
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
    await db.asset.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Asset could not be deleted.")
  }
}
