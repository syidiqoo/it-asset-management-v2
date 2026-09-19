"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import type { Role } from "@/lib/types"

export type SessionUser = {
  id: number
  username: string
  name: string
  role: Role
}

export function useSessionUser() {
  const [user, setUser] = React.useState<SessionUser | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.username) setUser(data)
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [])

  return user
}

export function useSignOut() {
  const router = useRouter()
  return React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }, [router])
}
