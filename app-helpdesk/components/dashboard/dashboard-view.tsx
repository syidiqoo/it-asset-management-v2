"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  AlertTriangle,
  Boxes,
  CheckCircle,
  FileText,
  MapPin,
  Plus,
  Smartphone,
  Wifi,
} from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { ConditionCard } from "@/components/dashboard/condition-card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { StoreState } from "@/components/store-state"
import { useSessionUser } from "@/components/use-session-user"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { conditionCounts } from "@/lib/dashboard"

const DashboardMap = dynamic(
  () =>
    import("@/components/dashboard/dashboard-map").then(
      (mod) => mod.DashboardMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 w-full items-center justify-center bg-muted/40 md:h-[390px]">
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <MapPin className="size-4" />
          Loading location map...
        </div>
      </div>
    ),
  }
)

export function DashboardView() {
  const store = useDataStore()
  const sessionUser = useSessionUser()
  const canWrite = sessionUser?.role === "admin"

  const today = React.useMemo(() => {
    const now = new Date()
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(now)
  }, [])

  const counts = React.useMemo(
    () => conditionCounts(store.assets),
    [store.assets]
  )
  const totalAssets = store.assets.length
  const issuesCount = counts.Damaged + counts["Under Repair"]

  const totalBandwidth = React.useMemo(
    () =>
      store.internetData.reduce(
        (sum, item) => sum + (item.bandwidthMbps ?? 0),
        0
      ),
    [store.internetData]
  )

  const plottedLocations = React.useMemo(
    () =>
      store.locations.filter(
        (location) => location.latitude !== null && location.longitude !== null
      ),
    [store.locations]
  )

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Actionable Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight md:text-xl">
              IT Operations Dashboard
            </h1>
            <span className="rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {today}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Hi {sessionUser?.name ?? "Admin"} — monitoring office assets, SIM devices, and internet network
          </p>
        </div>

        {canWrite ? (
          <div className="flex items-center gap-2">
            <Link
              href="/bast"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1.5 text-xs shadow-xs",
              })}
            >
              <FileText className="size-3.5" />
              BAST
            </Link>
            <Link
              href="/assets/new"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "gap-1.5 text-xs shadow-xs",
              })}
            >
              <Plus className="size-3.5" />
              Add Asset
            </Link>
          </div>
        ) : null}
      </div>

      <StoreState
        loading={store.loading}
        error={store.error}
        onRetry={store.refresh}
        empty={false}
      >
        <div className="flex flex-col gap-4">
          {/* 5 High-Density KPI Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              label="Total Assets"
              value={totalAssets}
              icon={Boxes}
              href="/assets"
              hint={`${store.categories.length} registered categories`}
            />
            <KpiCard
              label="Good Condition"
              value={counts.Good}
              icon={CheckCircle}
              href="/assets?condition=Good"
              hint={`${totalAssets === 0 ? "0%" : `${Math.round((counts.Good / totalAssets) * 100)}%`} operational ready`}
            />
            <KpiCard
              label="Needs Attention"
              value={issuesCount}
              icon={AlertTriangle}
              href="/assets?condition=Damaged"
              hint={
                issuesCount > 0
                  ? `${counts.Damaged} damaged, ${counts["Under Repair"]} under repair`
                  : "All assets are in good condition"
              }
            />
            <KpiCard
              label="SIM Card"
              value={store.simCards.length}
              icon={Smartphone}
              href="/sim-cards"
              hint={`${store.simPackages.length} provider quota packages`}
            />
            <KpiCard
              label="Internet Connection"
              value={store.internetData.length}
              icon={Wifi}
              href="/data-internet"
              hint={`${totalBandwidth} Mbps active capacity`}
              className="col-span-2 sm:col-span-1"
            />
          </div>

          {/* Compact Main Work Area: Map + Condition Summary */}
          <div className="grid gap-3 lg:grid-cols-12">
            {/* Map Card */}
            <Card className="relative z-0 flex flex-col justify-between overflow-hidden lg:col-span-7 xl:col-span-8">
              <div className="flex items-center justify-between border-b bg-muted/10 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold">Location Distribution Map</span>
                </div>
                <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                  {plottedLocations.length} of {store.locations.length} locations mapped
                </Badge>
              </div>

              <div className="h-80 w-full md:h-[390px]">
                <DashboardMap locations={store.locations} />
              </div>
            </Card>

            {/* Condition & Attention Card */}
            <ConditionCard className="h-full lg:col-span-5 xl:col-span-4" />
          </div>
        </div>
      </StoreState>
    </div>
  )
}
