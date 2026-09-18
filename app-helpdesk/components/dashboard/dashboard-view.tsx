"use client"

import * as React from "react"
import { Boxes, Building2, MapPin, Smartphone, Users, Wifi } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { StoreState } from "@/components/store-state"
import { StatGrid, type Stat } from "@/components/dashboard/stat-grid"
import { PageHeader } from "@/components/page-header"
import { CONDITIONS, type Condition } from "@/lib/types"

const CONDITION_DOT: Record<Condition, string> = {
  Good: "bg-emerald-500",
  Fair: "bg-amber-500",
  Damaged: "bg-red-500",
  "Under Repair": "bg-blue-500",
}

export function DashboardView() {
  const store = useDataStore()

  const counts = React.useMemo(() => {
    const result = Object.fromEntries(
      CONDITIONS.map((condition) => [condition, 0])
    ) as Record<Condition, number>

    for (const asset of store.assets) result[asset.condition] += 1
    return result
  }, [store.assets])

  const assetStats: Stat[] = [
    { label: "Total Assets", value: store.assets.length, icon: Boxes },
    ...CONDITIONS.map((condition) => ({
      label: condition,
      value: counts[condition],
      dotClassName: CONDITION_DOT[condition],
    })),
  ]

  const inventoryStats: Stat[] = [
    { label: "SIM Card", value: store.simCards.length, icon: Smartphone },
    { label: "Internet Data", value: store.internetData.length, icon: Wifi },
    { label: "Location", value: store.locations.length, icon: MapPin },
    { label: "Employee", value: store.employees.length, icon: Users },
    { label: "Department", value: store.departments.length, icon: Building2 },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Dashboard"
        description="Summary of IT assets and office inventory."
      />

      <StoreState
        loading={store.loading}
        error={store.error}
        onRetry={store.refresh}
        empty={false}
      >
        <div className="contents">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Asset Summary
        </h2>
        <StatGrid stats={assetStats} columns={5} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Other Inventory
        </h2>
        <StatGrid stats={inventoryStats} columns={5} />
      </section>
        </div>
      </StoreState>
    </div>
  )
}
