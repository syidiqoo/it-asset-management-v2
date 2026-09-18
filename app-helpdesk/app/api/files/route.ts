import { fail, ok, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import {
  UPLOAD_KINDS,
  fileExtension,
  mimeTypeFor,
  type UploadKind,
} from "@/lib/uploads"

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)

  const form = await request.formData().catch(() => null)
  if (!form) return fail("Invalid upload payload.")

  const kind = String(form.get("kind") ?? "") as UploadKind
  const config = UPLOAD_KINDS[kind]
  if (!config) return fail("Unknown upload kind.")

  const file = form.get("file")
  if (!(file instanceof File)) return fail("File is required.")

  if (!config.extensions.includes(fileExtension(file.name))) {
    return fail(`Unsupported file format. Use ${config.extensions.join(", ")}.`)
  }
  if (file.size > config.maxSize) {
    return fail(
      `File exceeds the ${Math.round(config.maxSize / 1024 / 1024)} MB limit.`
    )
  }

  const created = await db.fileBlob.create({
    data: {
      fileName: file.name,
      mimeType: mimeTypeFor(file.name),
      size: file.size,
      kind,
      data: Buffer.from(await file.arrayBuffer()),
    },
  })

  return ok({ id: created.id, url: `/api/files/${created.id}` }, 201)
}
