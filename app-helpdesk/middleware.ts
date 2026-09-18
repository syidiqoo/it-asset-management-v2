import { NextResponse } from "next/server"
import * as jose from "jose"

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
  let valid = false
  if (token && secret) {
    try {
      await jose.jwtVerify(token, new TextEncoder().encode(secret))
      valid = true
    } catch {
      valid = false
    }
  }

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
