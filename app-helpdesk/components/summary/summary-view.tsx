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
import { buildDepartmentTree } from "@/lib/departments"
import {
  summarizeDepartment,
  type SummaryCard,
  type SummaryInput,
  type SummaryItem,
  type SummaryPerson,
  type SummaryUnit,
} from "@/lib/summary"
import type { DepartmentNode, InternetData } from "@/lib/types"
import { cn } from "@/lib/utils"

const ITEM_ICONS: Record<SummaryItem["icon"], LucideIcon> = {
  laptop: Laptop,
  phone: Smartphone,
  monitor: Monitor,
  printer: Printer,
  sim: Radio,
  other: Box,
}

function ItemTag({ item }: { item: SummaryItem }) {
  const Icon = ITEM_ICONS[item.icon]
  const isSim = item.icon === "sim"
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Icon className="size-2.5 shrink-0" aria-hidden />
      <span className={cn(isSim && "font-mono")}>{item.value}</span>
    </span>
  )
}

function PersonBlock({ person }: { person: SummaryPerson }) {
  return (
    <div className="px-2.5 py-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs font-medium">{person.employee.name}</span>
        {person.positionLabel ? (
          <span className="truncate text-[11px] text-muted-foreground">
            {person.positionLabel}
          </span>
        ) : null}
      </div>
      {person.items.length > 0 ? (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {person.items.map((item, index) => (
            <ItemTag key={`${item.label}-${index}`} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PersonsList({ persons }: { persons: SummaryPerson[] }) {
  if (persons.length === 0) return null
  return (
    <div className="divide-y divide-border/50">
      {persons.map((person) => (
        <PersonBlock key={person.employee.id} person={person} />
      ))}
    </div>
  )
}

function InternetBadges({ internet }: { internet: InternetData[] }) {
  if (internet.length === 0) return null
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {internet.map((item) => (
        <Badge
          key={item.id}
          variant="outline"
          className="gap-1 border-sky-500/30 bg-sky-500/10 px-1.5 py-0 text-[11px] text-sky-700 dark:text-sky-300"
        >
          <Wifi className="size-2.5" aria-hidden />
          {item.service}
          {item.bandwidthMbps !== null ? ` · ${item.bandwidthMbps} Mbps` : ""}
        </Badge>
      ))}
    </div>
  )
}

function UnitTreeItem({ unit, isLast }: { unit: SummaryUnit; isLast: boolean }) {
  return (
    <div className="relative pl-5">
      {/* Vertical line continuation */}
      {!isLast ? (
        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />
      ) : null}
      {/* Horizontal branch */}
      <div className="absolute left-[7px] top-[14px] h-px w-[14px] bg-border" />
      {/* Dot */}
      <div className="absolute left-[4px] top-[11px] size-2 rounded-full border-2 border-primary bg-background" />

      {/* Unit content box */}
      <div className="overflow-hidden rounded-md border bg-muted/20">
        <div className="flex items-center gap-1.5 border-b bg-muted/30 px-2.5 py-1.5">
          <Building2 className="size-3 shrink-0 text-primary" aria-hidden />
          <span className="truncate text-xs font-semibold">
            {unit.department.name}
          </span>
          {unit.location ? (
            <span className="truncate text-[11px] text-muted-foreground">
              · {unit.location}
            </span>
          ) : null}
          <div className="ml-auto">
            <InternetBadges internet={unit.internet} />
          </div>
        </div>
        <PersonsList persons={unit.persons} />

        {/* Nested sub-units */}
        {unit.units.length > 0 ? (
          <div className="space-y-1 p-1.5 pl-0">
            {unit.units.map((sub, i) => (
              <UnitTreeItem
                key={sub.department.id}
                unit={sub}
                isLast={i === unit.units.length - 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DepartmentCard({
  name,
  location,
  internet,
  persons,
  units,
}: {
  name: string
  location: string | null
  internet: InternetData[]
  persons: SummaryPerson[]
  units: SummaryUnit[]
}) {
  const hasContent = persons.length > 0 || units.length > 0

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-start gap-2 border-b bg-muted/40 px-2.5 py-1.5">
        <Building2
          className="mt-0.5 size-3.5 shrink-0 text-primary"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{name}</p>
          {location ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {location}
            </p>
          ) : null}
        </div>
        <InternetBadges internet={internet} />
      </div>

      {hasContent ? (
        <div>
          {/* Direct employees */}
          <PersonsList persons={persons} />

          {/* Child units with tree */}
          {units.length > 0 ? (
            <div className="space-y-1.5 p-1.5">
              {units.map((unit, i) => (
                <UnitTreeItem
                  key={unit.department.id}
                  unit={unit}
                  isLast={i === units.length - 1}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="px-2.5 py-2 text-[11px] text-muted-foreground">
          No personnel yet.
        </p>
      )}
    </div>
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

  const cards = React.useMemo(() => {
    const subjects = root.children.length > 0 ? root.children : [root]
    return subjects
      .map((subject) => summarizeDepartment(subject, input))
      .filter((card): card is SummaryCard => card !== null)
      .sort(
        (a, b) =>
          b.weight - a.weight || a.title.localeCompare(b.title, "id")
      )
  }, [root, input])

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {root.name}
        </p>
      </button>

      {open ? (
        <div className="border-t p-1.5">
          {cards.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No departments in this group yet.
            </p>
          ) : (
            <div className="grid items-start gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <DepartmentCard
                  key={card.departmentId}
                  name={card.title}
                  location={card.location}
                  internet={card.internet}
                  persons={card.persons}
                  units={card.units}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
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
      buildDepartmentTree(store.departments).sort(
        (a, b) =>
          b.children.length - a.children.length ||
          a.name.localeCompare(b.name, "id")
      ),
    [store.departments]
  )

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Summary"
          description="Employees and their assets, SIM cards, and internet — grouped by department."
        />
      </StickyHeader>

      <div className="flex flex-col gap-2 p-3 md:p-4">
        <StoreState
          loading={store.loading}
          error={store.error}
          onRetry={store.refresh}
          empty={false}
        >
          <div className="contents">
            {roots.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No departments yet.
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
