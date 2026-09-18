import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializePackage } from "@/lib/server/serializers"
import { packageSchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.simPackage.findMany({ orderBy: { name: "asc" } })
  return ok(items.map(serializePackage))
}

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const parsed = packageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const name = parsed.data.name
  const existing = await db.simPackage.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  })
  if (existing) return fail("Package name is already in use.", 409)

  try {
    const item = await db.simPackage.create({ data: { name } })
    return ok(serializePackage(item), 201)
  } catch (error) {
    return prismaError(error, "Package name is already in use.")
  }
}
