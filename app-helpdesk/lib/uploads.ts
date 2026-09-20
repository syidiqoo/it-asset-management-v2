export type UploadKind = "image" | "document"

const MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
}

export const UPLOAD_KINDS: Record<
  UploadKind,
  { extensions: string[]; maxSize: number }
> = {
  image: {
    extensions: [".png", ".jpg", ".jpeg"],
    maxSize: 2 * 1024 * 1024,
  },
  document: {
    extensions: [".pdf"],
    maxSize: 2 * 1024 * 1024,
  },
}

export function uploadAccept(kind: UploadKind): string {
  return UPLOAD_KINDS[kind].extensions.join(",")
}

export function uploadHint(kind: UploadKind): string {
  const { extensions, maxSize } = UPLOAD_KINDS[kind]
  const formats = extensions.map((item) => item.slice(1).toUpperCase()).join(", ")
  return `${formats} (max ${Math.round(maxSize / 1024 / 1024)} MB)`
}

export function fileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".")
  return index === -1 ? "" : fileName.slice(index).toLowerCase()
}

export function mimeTypeFor(fileName: string): string {
  return MIME_BY_EXTENSION[fileExtension(fileName)] ?? "application/octet-stream"
}

export async function uploadFile(
  file: File,
  kind: UploadKind
): Promise<string> {
  const body = new FormData()
  body.append("kind", kind)
  body.append("file", file)

  const response = await fetch("/api/files", { method: "POST", body })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? "Upload failed.")
  }

  return data.url as string
}
