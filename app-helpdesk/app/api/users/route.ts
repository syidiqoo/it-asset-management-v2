import bcrypt from "bcryptjs"

import { fail, ok, prismaError, requireAdmin } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeUser } from "@/lib/server/serializers"
import { userCreateSchema, zodMessage } from "@/lib/server/validators"

export async function GET() {
  if (!(await requireAdmin())) return fail("Unauthorized.", 401)

  const users = await db.user.findMany({ orderBy: { id: "asc" } })
  return ok(users.map(serializeUser))
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail("Unauthorized.", 401)

  const parsed = userCreateSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { name, username, role, password } = parsed.data
  const existing = await db.user.findUnique({ where: { username } })
  if (existing) return fail(`Username ${username} is already used.`, 409)

  try {
    const item = await db.user.create({
      data: {
        name,
        username,
        role,
        passwordHash: await bcrypt.hash(password, 10),
      },
    })
    return ok(serializeUser(item), 201)
  } catch (error) {
    return prismaError(error, `Username ${username} is already used.`)
  }
}
