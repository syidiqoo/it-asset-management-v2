import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeAsset } from "@/lib/server/serializers"
import { assetSchema, zodMessage } from "@/lib/server/validators"

function fileBlobId(url: string | null): number | null {
  if (!url) return null
  const match = url.match(/^\/api\/files\/(\d+)$/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) ? id : null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser()
  if (!session) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = assetSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const existing = await db.asset.findFirst({
    where: {
      code: { equals: parsed.data.code, mode: "insensitive" },
      NOT: { id },
    },
  })
  if (existing) return fail("Code is already used by another asset.", 409)

  try {
    const current = await db.asset.findUnique({ where: { id } })
    if (!current) return fail("Data not found.", 404)

    const nextImageUrl = parsed.data.imageUrl ?? null
    const nextDocUrl = parsed.data.docUrl ?? null

    const pending: { kind: string; url: string }[] = []
    if (current.imageUrl && current.imageUrl !== nextImageUrl) {
      pending.push({ kind: "image", url: current.imageUrl })
    }
    if (current.docUrl && current.docUrl !== nextDocUrl) {
      pending.push({ kind: "document", url: current.docUrl })
    }

    const item = await db.$transaction(async (tx) => {
      if (pending.length > 0) {
        const blobIds = pending
          .map((entry) => fileBlobId(entry.url))
          .filter((value): value is number => value !== null)
        const blobs =
          blobIds.length > 0
            ? await tx.fileBlob.findMany({
                where: { id: { in: blobIds } },
                select: { id: true, fileName: true },
              })
            : []
        const fileNames = new Map(blobs.map((blob) => [blob.id, blob.fileName]))
        await tx.assetFileHistory.createMany({
          data: pending.map((entry) => ({
            assetId: id,
            kind: entry.kind,
            url: entry.url,
            fileName: fileNames.get(fileBlobId(entry.url) ?? -1) ?? null,
            createdBy: session.name,
          })),
        })
      }

      return tx.asset.update({
        where: { id },
        data: {
          categoryId: parsed.data.categoryId,
          name: parsed.data.name,
          code: parsed.data.code,
          serialNumber: parsed.data.serialNumber ?? null,
          employeeId: parsed.data.employeeId,
          departmentId: parsed.data.departmentId,
          condition: parsed.data.condition,
          imageUrl: parsed.data.imageUrl ?? null,
          docUrl: parsed.data.docUrl ?? null,
          purchaseDate: parsed.data.purchaseDate
            ? new Date(`${parsed.data.purchaseDate}T00:00:00Z`)
            : null,
          note: parsed.data.note ?? null,
          updatedBy: session.name,
        },
      })
    })

    return ok(serializeAsset(item))
  } catch (error) {
    return prismaError(error, "Code is already used by another asset.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  try {
    await db.asset.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Asset could not be deleted.")
  }
}
