import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeInternet } from "@/lib/server/serializers"
import { internetSchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.internetData.findMany({ orderBy: { id: "asc" } })
  return ok(items.map(serializeInternet))
}

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const parsed = internetSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const existing = await db.internetData.findUnique({
    where: { internetId: parsed.data.internetId },
  })
  if (existing) return fail("Internet ID is already in use.", 409)

  try {
    const item = await db.internetData.create({ data: parsed.data })
    return ok(serializeInternet(item), 201)
  } catch (error) {
    return prismaError(error, "Internet ID is already in use.")
  }
}
