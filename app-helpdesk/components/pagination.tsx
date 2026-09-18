"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1])
  const sorted = [...pages]
    .filter((item) => item >= 1 && item <= pageCount)
    .sort((a, b) => a - b)

  const result: (number | "gap")[] = []
  let previous = 0
  for (const item of sorted) {
    if (previous !== 0 && item - previous > 1) result.push("gap")
    result.push(item)
    previous = item
  }
  return result
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  unit,
  buildHref,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  unit: string
  buildHref: (page: number) => string
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Menampilkan{" "}
        <span className="font-medium text-foreground tabular-nums">{from}</span>
        {"–"}
        <span className="font-medium text-foreground tabular-nums">{to}</span>{" "}
        dari{" "}
        <span className="font-medium text-foreground tabular-nums">
          {total}
        </span>{" "}
        {unit}
      </p>

      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Button
            variant="outline"
            size="icon-sm"
            render={<Link href={buildHref(page - 1)} />}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon-sm"
            disabled
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft />
          </Button>
        )}

        {pageWindow(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="icon-sm"
              render={<Link href={buildHref(item)} />}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </Button>
          )
        )}

        {page < pageCount ? (
          <Button
            variant="outline"
            size="icon-sm"
            render={<Link href={buildHref(page + 1)} />}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon-sm"
            disabled
            aria-label="Halaman berikutnya"
          >
            <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  )
}
