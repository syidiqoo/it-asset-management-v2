import * as jose from "jose"
import { cookies } from "next/headers"

const COOKIE = "session"

function secret() {
  const value = process.env.SESSION_SECRET
  if (!value) throw new Error("SESSION_SECRET is not set")
  return new TextEncoder().encode(value)
}

export type Session = { id: number; username: string; name: string }

export async function createSession(session: Session) {
  const token = await new jose.SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret())
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jose.jwtVerify(token, secret())
    if (
      typeof payload.id !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null
    }
    return { id: payload.id, username: payload.username, name: payload.name }
  } catch {
    return null
  }
}
