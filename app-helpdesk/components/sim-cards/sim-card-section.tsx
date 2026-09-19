"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { Pagination } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { departmentName } from "@/lib/departments"
import { SIM_CARD_PAGE_SIZE } from "@/lib/sim-cards"
import type { SimCard } from "@/lib/types"
import { cn } from "@/lib/utils"

export function SimCardSection({
  title,
  description,
  cards,
  onPreview,
  defaultOpen = true,
}: {
  title: string
  description: string
  cards: SimCard[]
  onPreview: (card: SimCard) => void
  defaultOpen?: boolean
}) {
  const store = useDataStore()
  const [open, setOpen] = React.useState(defaultOpen)
  const [page, setPage] = React.useState(1)

  const employeeName = (id: number | null) =>
    id === null
      ? "—"
      : (store.employees.find((employee) => employee.id === id)?.name ?? "—")

  const packageName = (id: number | null) =>
    id === null
      ? "—"
      : (store.simPackages.find((item) => item.id === id)?.name ?? "—")

  const pageCount = Math.max(1, Math.ceil(cards.length / SIM_CARD_PAGE_SIZE))
  const safePage = Math.min(Math.max(page, 1), pageCount)
  const pageItems = cards.slice(
    (safePage - 1) * SIM_CARD_PAGE_SIZE,
    safePage * SIM_CARD_PAGE_SIZE
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
            {cards.length}
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
            {cards.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No SIM cards in this group.
              </p>
            ) : (
              <Card size="sm" className="py-0">
                <CardContent className="px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Phone Number</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>CLS Domestic</TableHead>
                        <TableHead className="pr-4">CLS Roaming</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageItems.map((card) => (
                        <TableRow
                          key={card.id}
                          className="cursor-pointer"
                          onClick={() => onPreview(card)}
                        >
                          <TableCell className="pl-4 font-mono text-xs font-medium">
                            {card.phoneNumber}
                          </TableCell>
                          <TableCell>{employeeName(card.employeeId)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {departmentName(
                              store.departments,
                              card.departmentId
                            ) ?? "—"}
                          </TableCell>
                          <TableCell>{packageName(card.packageId)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {card.clsDomestic ?? "—"}
                          </TableCell>
                          <TableCell className="pr-4 text-muted-foreground">
                            {card.clsRoaming ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {cards.length > 0 ? (
              <Pagination
                page={safePage}
                pageCount={pageCount}
                total={cards.length}
                unit="SIM card"
                pageSize={SIM_CARD_PAGE_SIZE}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
