"use client"

import * as React from "react"
import {
  Box,
  Building2,
  ChevronDown,
  Laptop,
  Monitor,
  Printer,
  Radio,
  Smartphone,
  Wifi,
  type LucideIcon,
} from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { buildDepartmentTree } from "@/lib/departments"
import {
  summarizeDepartment,
  type SummaryCard,
  type SummaryInput,
  type SummaryItem,
  type SummaryUnit,
} from "@/lib/summary"
import type { DepartmentNode } from "@/lib/types"
import { cn } from "@/lib/utils"

const ITEM_ICONS: Record<SummaryItem["icon"], LucideIcon> = {
  laptop: Laptop,
  phone: Smartphone,
  monitor: Monitor,
  printer: Printer,
  sim: Radio,
  other: Box,
}

function ItemRow({ item }: { item: SummaryItem }) {
  const Icon = ITEM_ICONS[item.icon]
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="w-16 shrink-0 text-xs text-muted-foreground">
        {item.label}
      </span>
      <span
        className={cn("truncate font-medium", item.icon === "sim" && "font-mono text-xs")}
      >
        {item.value}
      </span>
    </div>
  )
}

function InternetBadges({
  items,
  small = false,
}: {
  items: { id: number; service: string; bandwidthMbps: number | null }[]
  small?: boolean
}) {
  if (items.length === 0) return null
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {items.map((item) => (
        <Badge
          key={item.id}
          variant="outline"
          className={cn("gap-1 bg-primary/5", small && "px-1.5 text-[10px]")}
        >
          <Wifi className="size-3" />
          {item.service}
          {item.bandwidthMbps !== null ? ` · ${item.bandwidthMbps} Mbps` : ""}
        </Badge>
      ))}
    </div>
  )
}

function PersonCard({ person }: { person: SummaryCard["persons"][number] }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <p className="text-sm font-medium">{person.employee.name}</p>
        {person.positionLabel ? (
          <p className="truncate text-xs text-muted-foreground">
            {person.positionLabel}
          </p>
        ) : null}
      </div>
      {person.items.length > 0 ? (
        <div className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {person.items.map((item, index) => (
            <ItemRow key={`${item.label}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Belum ada aset atau SIM.
        </p>
      )}
    </div>
  )
}

function UnitCard({ unit }: { unit: SummaryUnit }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {unit.department.name}
        </p>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          Unit · {unit.personCount} org
        </Badge>
        <InternetBadges items={unit.internet} small />
      </div>
      <div className="mt-2 space-y-2">
        {unit.persons.map((person) => (
          <PersonCard key={person.employee.id} person={person} />
        ))}
        {unit.units.map((child) => (
          <UnitCard key={child.department.id} unit={child} />
        ))}
      </div>
    </div>
  )
}

function SummaryCardView({ summary }: { summary: SummaryCard }) {
  return (
    <Card className="w-full">
      <div className="flex items-start gap-3 border-b p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{summary.title}</p>
          {summary.identity ? (
            <p className="truncate text-xs text-muted-foreground">
              {summary.identity}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{summary.subtitle}</p>
        </div>
        <InternetBadges items={summary.internet} />
      </div>

      <CardContent className="space-y-4">
        {summary.persons.length > 0 ? (
          <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Personel {summary.title}
            </p>
            {summary.persons.map((person) => (
              <PersonCard key={person.employee.id} person={person} />
            ))}
          </section>
        ) : null}

        {summary.units.length > 0 ? (
          <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Unit di bawah {summary.title}
            </p>
            {summary.units.map((unit) => (
              <UnitCard key={unit.department.id} unit={unit} />
            ))}
          </section>
        ) : null}

        {summary.persons.length === 0 && summary.units.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada personel maupun unit di department ini.
          </p>
        ) : null}

        {summary.unassignedAssets > 0 || summary.unassignedSims > 0 ? (
          <p className="text-xs text-muted-foreground">
            {summary.unassignedAssets} asset & {summary.unassignedSims} SIM
            tanpa pemegang di lingkup ini.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SummarySection({
  root,
  input,
  defaultOpen = false,
}: {
  root: DepartmentNode
  input: SummaryInput
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  // Cards for each direct child department; a leaf top-level department
  // renders its own card.
  const summaries = React.useMemo(() => {
    const subjects = root.children.length > 0 ? root.children : [root]
    return subjects
      .map((subject) => summarizeDepartment(subject, input))
      .filter((card): card is SummaryCard => card !== null)
  }, [root, input])

  const personCount = summaries.reduce(
    (total, card) => total + card.personCount,
    0
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
            <p className="text-sm font-medium">{root.name}</p>
            <p className="text-xs text-muted-foreground">
              {summaries.length} department · {personCount} orang
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {summaries.length}
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
            {summaries.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada department di grup ini.
              </p>
            ) : (
              summaries.map((card) => (
                <SummaryCardView key={card.departmentId} summary={card} />
              ))
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function SummaryView() {
  const store = useDataStore()

  const input: SummaryInput = {
    departments: store.departments,
    positions: store.positions,
    employees: store.employees,
    assets: store.assets,
    simCards: store.simCards,
    categories: store.categories,
    internetData: store.internetData,
    locations: store.locations,
  }

  const roots = React.useMemo(
    () =>
      buildDepartmentTree(store.departments).sort((a, b) =>
        a.name.localeCompare(b.name, "id")
      ),
    [store.departments]
  )

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Summary"
          description="Ringkasan per department: lokasi, personel dan posisinya, aset, SIM card, serta layanan internet."
        />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <StoreState
          loading={store.loading}
          error={store.error}
          onRetry={store.refresh}
          empty={false}
        >
          <div className="flex flex-col gap-4">
            {roots.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Belum ada department.
              </p>
            ) : (
              roots.map((root, index) => (
                <SummarySection
                  key={root.id}
                  root={root}
                  input={input}
                  defaultOpen={index === 0}
                />
              ))
            )}
          </div>
        </StoreState>
      </div>
    </div>
  )
}
