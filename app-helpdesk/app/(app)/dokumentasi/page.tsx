import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Plus } from "lucide-react"

import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DOC_FILTER_NAMES } from "@/lib/docs"
import {
  hasActiveFilters,
  parseFilterValues,
  type FilterField,
} from "@/lib/filters"
import { formatDate } from "@/lib/format"
import { toDay } from "@/lib/server/api"
import { getSession } from "@/lib/server/auth"
import { db } from "@/lib/server/db"

export const metadata: Metadata = {
  title: "Dokumentasi — IT Helpdesk",
}

const FIELDS: FilterField[] = [
  {
    type: "search",
    name: "q",
    label: "Search",
    placeholder: "Judul atau isi dokumen",
  },
]

export default async function DokumentasiPage(
  props: PageProps<"/dokumentasi">
) {
  const searchParams = await props.searchParams
  const { values } = parseFilterValues(searchParams, DOC_FILTER_NAMES)
  const query = values.q ?? ""
  const session = await getSession()
  const canWrite = session?.role === "admin"

  const docs = await db.doc.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      updatedBy: true,
      updatedAt: true,
    },
  })

  const filtered = hasActiveFilters(values)

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Dokumentasi"
          description="Dokumentasi internal tim IT — topologi jaringan, prosedur, dan catatan operasional."
          actions={
            canWrite ? (
              <Button size="sm" render={<Link href="/dokumentasi/new" />}>
                <Plus />
                New Document
              </Button>
            ) : null
          }
        />
        <FilterBar fields={FIELDS} values={values} />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        {docs.length === 0 ? (
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <BookOpen className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {filtered ? "No documents found" : "No documents yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filtered
                    ? "Change keywords or reset filters to see other data."
                    : "Buat dokumen pertama untuk memulai wiki ini."}
                </p>
              </div>
              {canWrite && !filtered ? (
                <Button size="sm" render={<Link href="/dokumentasi/new" />}>
                  <Plus />
                  New Document
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card size="sm" className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Document</TableHead>
                    <TableHead className="pr-4">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="pl-4">
                        <Link
                          href={`/dokumentasi/${doc.slug}`}
                          className="block space-y-0.5"
                        >
                          <span className="text-sm font-medium hover:underline">
                            {doc.title}
                          </span>
                          {doc.summary ? (
                            <span className="block max-w-2xl truncate text-xs text-muted-foreground">
                              {doc.summary}
                            </span>
                          ) : null}
                        </Link>
                      </TableCell>
                      <TableCell className="pr-4 text-xs text-muted-foreground">
                        <span className="block">{doc.updatedBy ?? "—"}</span>
                        <span className="block tabular-nums">
                          {formatDate(toDay(doc.updatedAt))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
