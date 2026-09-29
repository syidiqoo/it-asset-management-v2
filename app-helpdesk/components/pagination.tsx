"use client"

import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Button from "@mui/material/Button"

import Link from "@/components/ui/link"

const ICON_BUTTON = "size-7 min-w-0 p-0"

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

function PageActionButton({
  targetPage,
  disabled,
  label,
  buildHref,
  onPageChange,
  children,
}: {
  targetPage: number
  disabled: boolean
  label: string
  buildHref?: (page: number) => string
  onPageChange?: (page: number) => void
  children: ReactNode
}) {
  if (disabled || (!buildHref && !onPageChange)) {
    return (
      <Button
        variant="outlined"
        size="small"
        className={ICON_BUTTON}
        disabled
        aria-label={label}
      >
        {children}
      </Button>
    )
  }
  if (onPageChange) {
    return (
      <Button
        variant="outlined"
        size="small"
        className={ICON_BUTTON}
        onClick={() => onPageChange(targetPage)}
        aria-label={label}
      >
        {children}
      </Button>
    )
  }
  return (
    <Button
      variant="outlined"
      size="small"
      className={ICON_BUTTON}
      component={Link}
      href={(buildHref as (page: number) => string)(targetPage)}
      aria-label={label}
    >
      {children}
    </Button>
  )
}

function PageNumberButton({
  item,
  active,
  buildHref,
  onPageChange,
}: {
  item: number
  active: boolean
  buildHref?: (page: number) => string
  onPageChange?: (page: number) => void
}) {
  if (onPageChange) {
    return (
      <Button
        variant={active ? "contained" : "outlined"}
        size="small"
        className={ICON_BUTTON}
        onClick={() => onPageChange(item)}
        aria-current={active ? "page" : undefined}
      >
        {item}
      </Button>
    )
  }
  return (
    <Button
      variant={active ? "contained" : "outlined"}
      size="small"
      className={ICON_BUTTON}
      component={Link}
      href={(buildHref as (page: number) => string)(item)}
      aria-current={active ? "page" : undefined}
    >
      {item}
    </Button>
  )
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  unit,
  buildHref,
  onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  unit: string
  buildHref?: (page: number) => string
  onPageChange?: (page: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground tabular-nums">{from}</span>
        {"–"}
        <span className="font-medium text-foreground tabular-nums">{to}</span>{" "}
        of{" "}
        <span className="font-medium text-foreground tabular-nums">
          {total}
        </span>{" "}
        {unit}
      </p>

      <div className="flex items-center gap-1">
        <PageActionButton
          targetPage={page - 1}
          disabled={page <= 1}
          label="Previous page"
          buildHref={buildHref}
          onPageChange={onPageChange}
        >
          <ChevronLeft className="size-4" />
        </PageActionButton>

        {pageWindow(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <PageNumberButton
              key={item}
              item={item}
              active={item === page}
              buildHref={buildHref}
              onPageChange={onPageChange}
            />
          )
        )}

        <PageActionButton
          targetPage={page + 1}
          disabled={page >= pageCount}
          label="Next page"
          buildHref={buildHref}
          onPageChange={onPageChange}
        >
          <ChevronRight className="size-4" />
        </PageActionButton>
      </div>
    </div>
  )
}
