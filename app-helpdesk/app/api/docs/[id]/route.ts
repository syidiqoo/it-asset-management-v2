import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeDoc } from "@/lib/server/serializers"
import { docSchema, zodMessage } from "@/lib/server/validators"

const DUPLICATE_SLUG = "Slug is already used by another document."

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser()
  if (!session) return fail("Unauthorized.", 401)
  if (session.role !== "admin") return fail("Forbidden.", 403)

  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = docSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { title, slug, summary, content } = parsed.data

  const existing = await db.doc.findFirst({
    where: { slug, NOT: { id } },
  })
  if (existing) return fail(DUPLICATE_SLUG, 409)

  try {
    const item = await db.doc.update({
      where: { id },
      data: {
        title,
        slug,
        summary: summary ?? null,
        content,
        updatedBy: session.name,
      },
    })
    return ok(serializeDoc(item))
  } catch (error) {
    return prismaError(error, DUPLICATE_SLUG)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser()
  if (!session) return fail("Unauthorized.", 401)
  if (session.role !== "admin") return fail("Forbidden.", 403)

  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  try {
    await db.doc.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Document could not be deleted.")
  }
}
