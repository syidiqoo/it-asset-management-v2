import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { DocEditor } from "@/components/dokumentasi/doc-editor"
import { toDay } from "@/lib/server/api"
import { getSession } from "@/lib/server/auth"
import { db } from "@/lib/server/db"

export const metadata: Metadata = {
  title: "Edit Document — IT Helpdesk",
}

export default async function EditDocPage(
  props: PageProps<"/dokumentasi/[slug]/edit">
) {
  const session = await getSession()
  if (session?.role !== "admin") redirect("/dokumentasi")

  const { slug } = await props.params
  const doc = await db.doc.findUnique({ where: { slug } })
  if (!doc) notFound()

  return (
    <DocEditor
      doc={{
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        summary: doc.summary,
        content: doc.content,
        updatedBy: doc.updatedBy,
        createdAt: toDay(doc.createdAt) ?? "",
        updatedAt: toDay(doc.updatedAt) ?? "",
      }}
    />
  )
}
