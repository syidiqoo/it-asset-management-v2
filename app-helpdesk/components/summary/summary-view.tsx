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
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className={cn(isSim && "font-mono")}>{item.value}</span>
    </span>
  )
}

function PersonBlock({ person }: { person: SummaryPerson }) {
  return (
    <div className="px-3 py-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium">{person.employee.name}</span>
        {person.positionLabel ? (
          <span className="truncate text-xs text-muted-foreground">
            {person.positionLabel}
          </span>
        ) : null}
      </div>
      {person.items.length > 0 ? (
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {person.items.map((item, index) => (
            <ItemTag key={`${item.label}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No assets or SIM cards.
        </p>
      )}
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
      <div className="flex items-start gap-2 border-b bg-muted/40 px-3 py-2">
        <Building2
          className="mt-0.5 size-3.5 shrink-0 text-primary"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          {location ? (
            <p className="truncate text-xs text-muted-foreground">{location}</p>
          ) : null}
        </div>
        {internet.length > 0 ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {internet.map((item) => (
              <Badge
                key={item.id}
                variant="outline"
                className="gap-1 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
              >
                <Wifi className="size-3" aria-hidden />
                {item.service}
                {item.bandwidthMbps !== null
                  ? ` · ${item.bandwidthMbps} Mbps`
                  : ""}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {hasContent ? (
        <div className="divide-y">
          {persons.map((person) => (
            <PersonBlock key={person.employee.id} person={person} />
          ))}
          {units.map((unit) => (
            <div key={unit.department.id} className="p-2">
              <DepartmentCard
                name={unit.department.name}
                location={unit.location}
                internet={unit.internet}
                persons={unit.persons}
                units={unit.units}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="px-3 py-2 text-xs text-muted-foreground">
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
  }, [root, input])

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left"
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {root.name}
        </p>
      </button>

      {open ? (
        <div className="border-t p-2">
          {cards.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No departments in this group yet.
            </p>
          ) : (
            <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
          description="Employees and their assets, SIM cards, and internet — grouped by department."
        />
      </StickyHeader>

      <div className="flex flex-col gap-3 p-4 md:p-6">
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
