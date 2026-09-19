import bcrypt from "bcryptjs"

import { fail, ok, prismaError, requireAdmin } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeUser } from "@/lib/server/serializers"
import { userUpdateSchema, zodMessage } from "@/lib/server/validators"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return fail("Unauthorized.", 401)

  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = userUpdateSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { name, username, role, password } = parsed.data

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return fail("User not found.", 404)

  if (target.role === "admin" && role !== "admin") {
    const admins = await db.user.count({ where: { role: "admin" } })
    if (admins <= 1) return fail("At least one admin must remain.", 409)
  }

  const taken = await db.user.findFirst({ where: { username, NOT: { id } } })
  if (taken) return fail(`Username ${username} is already used.`, 409)

  try {
    const item = await db.user.update({
      where: { id },
      data: {
        name,
        username,
        role,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    })
    return ok(serializeUser(item))
  } catch (error) {
    return prismaError(error, `Username ${username} is already used.`)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return fail("Unauthorized.", 401)

  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  if (id === session.id) {
    return fail("You cannot delete your own account.", 409)
  }

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return fail("User not found.", 404)

  if (target.role === "admin") {
    const admins = await db.user.count({ where: { role: "admin" } })
    if (admins <= 1) return fail("At least one admin must remain.", 409)
  }

  try {
    await db.user.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "User could not be deleted.")
  }
}
