import { NextResponse } from "next/server"
import * as jose from "jose"

import { ROLES, type Role } from "@/lib/types"

const GUEST_PAGES = ["/dashboard", "/assets", "/sim-cards", "/data-internet"]

function readRole(payload: Record<string, unknown>): Role | null {
  const role = payload.role
  return typeof role === "string" && (ROLES as string[]).includes(role)
    ? (role as Role)
    : null
}

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url)

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("session="))
    ?.slice("session=".length)

  const secret = process.env.SESSION_SECRET
  let role: Role | null = null
  if (token && secret) {
    try {
      const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret))
      role = readRole(payload)
    } catch {
      role = null
    }
  }

  if (!role) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (role === "guest") {
    if (pathname.startsWith("/api/")) {
      if (pathname.startsWith("/api/users")) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 })
      }
      if (request.method !== "GET") {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 })
      }
      return NextResponse.next()
    }

    if (!GUEST_PAGES.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico|css|js|woff2?|txt|pdf)$).*)",
  ],
}
