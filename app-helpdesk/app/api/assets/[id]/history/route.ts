import { fail, ok, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeAssetFileHistory } from "@/lib/server/serializers"

const HISTORY_LIMIT = 5

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const exists = await db.asset.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!exists) return fail("Data not found.", 404)

  const [image, document] = await Promise.all(
    (["image", "document"] as const).map((kind) =>
      db.assetFileHistory.findMany({
        where: { assetId: id, kind },
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT,
      })
    )
  )

  return ok({
    image: image.map(serializeAssetFileHistory),
    document: document.map(serializeAssetFileHistory),
  })
}
