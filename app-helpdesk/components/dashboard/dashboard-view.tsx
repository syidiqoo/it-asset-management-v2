"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Boxes, Smartphone, Wifi } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { ConditionCard } from "@/components/dashboard/condition-card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { StoreState } from "@/components/store-state"
import { useSessionUser } from "@/components/use-session-user"
import { Card } from "@/components/ui/card"
import { conditionCounts, percent } from "@/lib/dashboard"

const DashboardMap = dynamic(
  () =>
    import("@/components/dashboard/dashboard-map").then(
      (mod) => mod.DashboardMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full animate-pulse bg-muted md:h-96" />
    ),
  }
)

export function DashboardView() {
  const store = useDataStore()
  const sessionUser = useSessionUser()

  const today = React.useMemo(() => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    return `${day}/${month}/${now.getFullYear()}`
  }, [])

  const counts = React.useMemo(
    () => conditionCounts(store.assets),
    [store.assets]
  )
  const totalAssets = store.assets.length

  const totalBandwidth = store.internetData.reduce(
    (sum, item) => sum + (item.bandwidthMbps ?? 0),
    0
  )

  const plottedCount = React.useMemo(
    () =>
      store.locations.filter(
        (location) => location.latitude !== null && location.longitude !== null
      ).length,
    [store.locations]
  )

  const share = (value: number) =>
    totalAssets === 0 ? 0 : (value / totalAssets) * 100

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Selamat datang, {sessionUser?.name ?? "—"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan IT assets dan inventory kantor — {today}
        </p>
      </div>

      <StoreState
        loading={store.loading}
        error={store.error}
        onRetry={store.refresh}
        empty={false}
      >
        <div className="contents">
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Overview
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total Assets"
                value={totalAssets}
                icon={Boxes}
                hint={`${store.categories.length} categories`}
              />
              <KpiCard
                label="Good Assets"
                value={counts.Good}
                hint={`${percent(counts.Good, totalAssets)} of assets`}
                progress={share(counts.Good)}
              />
              <KpiCard
                label="Total SIM Card"
                value={store.simCards.length}
                icon={Smartphone}
                hint={`${store.simPackages.length} packages`}
              />
              <KpiCard
                label="Internet Data"
                value={store.internetData.length}
                icon={Wifi}
                hint={`${totalBandwidth} Mbps total`}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Location Map
            </h2>
            <div className="grid gap-3 lg:grid-cols-12">
              <Card className="relative z-0 h-80 overflow-hidden [--card-spacing:0] md:h-96 lg:col-span-8">
                <DashboardMap locations={store.locations} />
              </Card>
              <ConditionCard className="lg:col-span-4 lg:h-96" />
            </div>
            <p className="text-xs text-muted-foreground">
              {plottedCount} of {store.locations.length} locations have
              coordinates.
            </p>
          </section>
        </div>
      </StoreState>
    </div>
  )
}
