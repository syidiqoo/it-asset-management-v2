import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DocEditor } from "@/components/dokumentasi/doc-editor"
import { getSession } from "@/lib/server/auth"

export const metadata: Metadata = {
  title: "New Document — IT Helpdesk",
}

export default async function NewDocPage() {
  const session = await getSession()
  if (session?.role !== "admin") redirect("/dokumentasi")

  return <DocEditor />
}
