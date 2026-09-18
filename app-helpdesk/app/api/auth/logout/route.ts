import { clearSession } from "@/lib/server/auth"
import { ok } from "@/lib/server/api"

export async function POST() {
  await clearSession()
  return ok({ ok: true })
}
