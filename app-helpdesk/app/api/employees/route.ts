import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeEmployee } from "@/lib/server/serializers"
import { employeeSchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.employee.findMany({ orderBy: { name: "asc" } })
  return ok(items.map(serializeEmployee))
}

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const parsed = employeeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { name, departmentId } = parsed.data
  try {
    const item = await db.employee.create({ data: { name, departmentId } })
    return ok(serializeEmployee(item), 201)
  } catch (error) {
    return prismaError(error, "Employee could not be created.")
  }
}
