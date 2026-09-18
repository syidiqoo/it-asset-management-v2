import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeAsset } from "@/lib/server/serializers"
import { assetSchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.asset.findMany({ orderBy: { id: "asc" } })
  return ok(items.map(serializeAsset))
}

export async function POST(request: Request) {
  const session = await requireUser()
  if (!session) return fail("Unauthorized.", 401)
  const parsed = assetSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { code } = parsed.data
  const existing = await db.asset.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
  })
  if (existing) return fail("Code is already used by another asset.", 409)

  try {
    const item = await db.asset.create({
      data: {
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        code,
        serialNumber: parsed.data.serialNumber ?? null,
        employeeId: parsed.data.employeeId,
        departmentId: parsed.data.departmentId,
        condition: parsed.data.condition,
        imageUrl: parsed.data.imageUrl ?? null,
        docUrl: parsed.data.docUrl ?? null,
        recordDate: new Date(),
        purchaseDate: parsed.data.purchaseDate
          ? new Date(`${parsed.data.purchaseDate}T00:00:00Z`)
          : null,
        note: parsed.data.note ?? null,
        updatedBy: session.name,
      },
    })
    return ok(serializeAsset(item), 201)
  } catch (error) {
    return prismaError(error, "Code is already used by another asset.")
  }
}
