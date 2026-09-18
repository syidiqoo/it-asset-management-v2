import bcrypt from "bcryptjs"
import { z } from "zod"
import { createSession } from "@/lib/server/auth"
import { fail, ok } from "@/lib/server/api"
import { db } from "@/lib/server/db"

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail("Invalid username or password.", 401)

  const { username, password } = parsed.data
  const user = await db.user.findUnique({ where: { username } })
  if (!user) return fail("Invalid username or password.", 401)

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return fail("Invalid username or password.", 401)

  await createSession({ id: user.id, username: user.username, name: user.name })
  return ok({ id: user.id, username: user.username, name: user.name })
}
