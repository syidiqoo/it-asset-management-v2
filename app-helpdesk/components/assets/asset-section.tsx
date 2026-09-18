"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { AssetTable } from "@/components/assets/asset-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"
import { ASSET_PAGE_SIZE } from "@/lib/assets"
import type { Asset } from "@/lib/types"
import { cn } from "@/lib/utils"

export function AssetSection({
  title,
  description,
  assets,
  unit,
  defaultOpen = true,
}: {
  title: string
  description: string
  assets: Asset[]
  unit: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [page, setPage] = React.useState(1)

  const pageCount = Math.max(1, Math.ceil(assets.length / ASSET_PAGE_SIZE))
  const safePage = Math.min(Math.max(page, 1), pageCount)
  const pageItems = assets.slice(
    (safePage - 1) * ASSET_PAGE_SIZE,
    safePage * ASSET_PAGE_SIZE
  )

  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 text-left"
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {assets.length}
          </Badge>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open ? (
          <div className="space-y-4">
            <AssetTable assets={pageItems} />

            {assets.length > 0 ? (
              <Pagination
                page={safePage}
                pageCount={pageCount}
                total={assets.length}
                pageSize={ASSET_PAGE_SIZE}
                unit={unit}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
