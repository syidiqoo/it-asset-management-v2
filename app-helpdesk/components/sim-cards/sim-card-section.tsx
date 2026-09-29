"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Chip from "@mui/material/Chip"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"

import { useDataStore } from "@/components/data-store"
import { Pagination } from "@/components/pagination"
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
    <Card variant="outlined">
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
          <Chip
            size="small"
            label={cards.length}
            className="shrink-0 tabular-nums"
          />
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
              <Card variant="outlined" className="py-0">
                <CardContent className="p-0">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Phone Number</TableCell>
                        <TableCell>Employee</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Package</TableCell>
                        <TableCell>CLS Domestic</TableCell>
                        <TableCell>CLS Roaming</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pageItems.map((card) => (
                        <TableRow
                          key={card.id}
                          hover
                          className="cursor-pointer"
                          onClick={() => onPreview(card)}
                        >
                          <TableCell className="font-mono text-xs font-medium">
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
                          <TableCell className="text-muted-foreground">
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
