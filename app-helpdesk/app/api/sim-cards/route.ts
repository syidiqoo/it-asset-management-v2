import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeSimCard } from "@/lib/server/serializers"
import { simCardSchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.simCard.findMany({ orderBy: { id: "asc" } })
  return ok(items.map(serializeSimCard))
}

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const parsed = simCardSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { phoneNumber } = parsed.data
  const existing = await db.simCard.findUnique({
    where: { phoneNumber },
  })
  if (existing) return fail("Phone Number is already registered.", 409)

  try {
    const item = await db.simCard.create({
      data: {
        phoneNumber,
        employeeId: parsed.data.employeeId,
        departmentId: parsed.data.departmentId,
        packageId: parsed.data.packageId,
        clsDomestic: parsed.data.clsDomestic ?? null,
        clsRoaming: parsed.data.clsRoaming ?? null,
        note: parsed.data.note ?? null,
        terminated: parsed.data.terminated,
      },
    })
    return ok(serializeSimCard(item), 201)
  } catch (error) {
    return prismaError(error, "Phone Number is already registered.")
  }
}
