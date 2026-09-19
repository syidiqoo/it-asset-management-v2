import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireUser() {
  const session = await getSession()
  if (!session) return null
  return session
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "admin") return null
  return session
}

export function toDay(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export function prismaError(error: unknown, duplicateMessage: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return fail(duplicateMessage, 409)
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return fail("Referenced data does not exist.", 400)
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return fail("Data not found.", 404)
  }
  throw error
}
