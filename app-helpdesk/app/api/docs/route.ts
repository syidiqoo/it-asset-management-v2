import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeDoc } from "@/lib/server/serializers"
import { docSchema, zodMessage } from "@/lib/server/validators"

const DUPLICATE_SLUG = "Slug is already used by another document."

export async function POST(request: Request) {
  const session = await requireUser()
  if (!session) return fail("Unauthorized.", 401)
  if (session.role !== "admin") return fail("Forbidden.", 403)

  const parsed = docSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { title, slug, summary, content } = parsed.data

  const existing = await db.doc.findUnique({ where: { slug } })
  if (existing) return fail(DUPLICATE_SLUG, 409)

  try {
    const item = await db.doc.create({
      data: {
        title,
        slug,
        summary: summary ?? null,
        content,
        updatedBy: session.name,
      },
    })
    return ok(serializeDoc(item), 201)
  } catch (error) {
    return prismaError(error, DUPLICATE_SLUG)
  }
}
