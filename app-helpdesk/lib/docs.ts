export const DOC_FILTER_NAMES = ["q"]

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "")

  return slug || "dokumen"
}
