import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializePosition } from "@/lib/server/serializers"
import { positionSchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.position.findMany({ orderBy: { name: "asc" } })
  return ok(items.map(serializePosition))
}

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
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
    where: { name: name, departmentId: departmentId },
  })
  if (existing) {
    return fail("Position name is already used in that department.", 409)
  }

  try {
    const item = await db.position.create({ data: { name, departmentId } })
    return ok(serializePosition(item), 201)
  } catch (error) {
    return prismaError(error, "Position could not be created.")
  }
}
