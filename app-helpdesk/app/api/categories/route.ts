import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeCategory } from "@/lib/server/serializers"
import { categorySchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.category.findMany({ orderBy: { name: "asc" } })
  return ok(items.map(serializeCategory))
}

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const parsed = categorySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const name = parsed.data.name
  const existing = await db.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  })
  if (existing) return fail("Category name is already in use.", 409)

  try {
    const item = await db.category.create({ data: { name } })
    return ok(serializeCategory(item), 201)
  } catch (error) {
    return prismaError(error, "Category name is already in use.")
  }
}
