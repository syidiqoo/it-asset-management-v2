import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeLocation } from "@/lib/server/serializers"
import { locationSchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.location.findMany({ orderBy: { code: "asc" } })
  return ok(items.map(serializeLocation))
}

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const parsed = locationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { code, address, detailStreetAddress, latitude, longitude } =
    parsed.data
  const existing = await db.location.findUnique({ where: { code } })
  if (existing) return fail(`Code ${code} is already used by another location.`, 409)

  try {
    const item = await db.location.create({
      data: { code, address, detailStreetAddress, latitude, longitude },
    })
    return ok(serializeLocation(item), 201)
  } catch (error) {
    return prismaError(error, `Code ${code} is already used by another location.`)
  }
}
