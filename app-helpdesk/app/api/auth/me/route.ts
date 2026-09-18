import { getSession } from "@/lib/server/auth"
import { fail, ok } from "@/lib/server/api"

export async function GET() {
  const session = await getSession()
  if (!session) return fail("Unauthorized.", 401)
  return ok(session)
}
