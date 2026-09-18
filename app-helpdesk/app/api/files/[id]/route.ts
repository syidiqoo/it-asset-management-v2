import { fail, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)

  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("File not found.", 404)

  const file = await db.fileBlob.findUnique({ where: { id } })
  if (!file) return fail("File not found.", 404)

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
