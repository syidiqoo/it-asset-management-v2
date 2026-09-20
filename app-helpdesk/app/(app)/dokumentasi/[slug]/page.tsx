import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import { DocDeleteButton } from "@/components/dokumentasi/doc-actions"
import { Markdown } from "@/components/dokumentasi/markdown"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { toDay } from "@/lib/server/api"
import { getSession } from "@/lib/server/auth"
import { db } from "@/lib/server/db"

export async function generateMetadata(
  props: PageProps<"/dokumentasi/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const doc = await db.doc.findUnique({
    where: { slug },
    select: { title: true },
  })

  return {
    title: doc ? `${doc.title} — IT Helpdesk` : "Dokumentasi — IT Helpdesk",
  }
}

export default async function DocPage(props: PageProps<"/dokumentasi/[slug]">) {
  const { slug } = await props.params
  const doc = await db.doc.findUnique({ where: { slug } })
  if (!doc) notFound()

  const session = await getSession()
  const canWrite = session?.role === "admin"

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit text-muted-foreground"
          render={<Link href="/dokumentasi" />}
        >
          <ArrowLeft />
          Dokumentasi
        </Button>
        <PageHeader
          title={doc.title}
          description={doc.summary ?? undefined}
          actions={
            canWrite ? (
              <>
                <DocDeleteButton id={doc.id} title={doc.title} />
                <Button
                  size="sm"
                  render={<Link href={`/dokumentasi/${doc.slug}/edit`} />}
                >
                  <Pencil />
                  Edit
                </Button>
              </>
            ) : null
          }
        />
        <p className="text-xs text-muted-foreground">
          Terakhir diubah {formatDate(toDay(doc.updatedAt))}
          {doc.updatedBy ? ` oleh ${doc.updatedBy}` : ""}
        </p>
      </StickyHeader>

      <div className="p-4 md:p-6">
        <Card size="sm">
          <CardContent>
            <Markdown content={doc.content} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
