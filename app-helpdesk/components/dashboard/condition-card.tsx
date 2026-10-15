"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, Wrench } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CONDITION_HEX, conditionCounts } from "@/lib/dashboard"
import { CONDITIONS } from "@/lib/types"
import { cn } from "@/lib/utils"

const DONUT_SIZE = 140
const DONUT_THICKNESS = 16

function Donut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[]
  centerValue: number
  centerLabel: string
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const radius = (DONUT_SIZE - DONUT_THICKNESS) / 2
  const circumference = 2 * Math.PI * radius

  const active = segments.filter((segment) => segment.value > 0)
  const arcs = active.map((segment, index) => {
    const length = (segment.value / (total || 1)) * circumference
    const offset = active
      .slice(0, index)
      .reduce(
        (sum, previous) =>
          sum + (previous.value / (total || 1)) * circumference,
        0
      )
    return { ...segment, length, offset }
  })

  return (
    <div
      className="relative shrink-0"
      style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
    >
      <svg
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
        className="-rotate-90"
        role="img"
        aria-label={`${centerLabel}: ${centerValue}`}
      >
        <circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={radius}
          fill="none"
          strokeWidth={DONUT_THICKNESS}
          className="stroke-muted/60"
        />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={radius}
            fill="none"
            strokeWidth={DONUT_THICKNESS}
            stroke={arc.color}
            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums">{centerValue}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {centerLabel}
        </span>
      </div>
    </div>
  )
}

export function ConditionCard({ className }: { className?: string }) {
  const store = useDataStore()

  const totals = React.useMemo(
    () => conditionCounts(store.assets),
    [store.assets]
  )
  const totalAssets = store.assets.length

  // Find assets needing immediate attention (Damaged or Under Repair)
  const attentionAssets = React.useMemo(() => {
    return store.assets
      .filter((a) => a.condition === "Damaged" || a.condition === "Under Repair")
      .slice(0, 3)
  }, [store.assets])

  return (
    <Card size="sm" className={cn("flex flex-col justify-between overflow-hidden", className)}>
      <CardHeader className="p-3.5 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Asset Health & Condition</CardTitle>
          <Link
            href="/assets"
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            All Assets
            <ArrowRight className="size-3" />
          </Link>
        </div>
        <CardDescription className="text-xs">
          Status distribution across {totalAssets} recorded assets
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 p-3.5 pt-1">
        {/* Top: Donut Chart + Condensed Legend */}
        <div className="flex items-center justify-around gap-2 rounded-lg border bg-muted/20 p-2.5">
          <Donut
            segments={CONDITIONS.map((condition) => ({
              label: condition,
              value: totals[condition],
              color: CONDITION_HEX[condition],
            }))}
            centerValue={totalAssets}
            centerLabel="Assets"
          />

          <div className="flex flex-col justify-center gap-1.5 text-xs">
            {CONDITIONS.map((condition) => {
              const count = totals[condition]
              const pct = totalAssets === 0 ? "0%" : `${Math.round((count / totalAssets) * 100)}%`
              return (
                <div key={condition} className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: CONDITION_HEX[condition] }}
                  />
                  <span className="w-20 text-[11px] text-muted-foreground truncate">{condition}</span>
                  <span className="font-semibold tabular-nums text-xs">{count}</span>
                  <span className="text-[10px] text-muted-foreground/80 w-7 text-right">({pct})</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom: Actionable Attention List */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Needs Attention
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-1.5 text-[10px]",
                totals.Damaged + totals["Under Repair"] > 0
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/50 text-muted-foreground"
              )}
            >
              {totals.Damaged + totals["Under Repair"]} issue(s)
            </Badge>
          </div>

          {attentionAssets.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>All assets are in good operating condition.</span>
            </div>
          ) : (
            <div className="divide-y rounded-md border bg-card">
              {attentionAssets.map((asset) => (
                <Link
                  key={asset.id}
                  href={`/assets?q=${encodeURIComponent(asset.code)}`}
                  className="flex items-center justify-between p-2 text-xs transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-medium">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{asset.code}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 gap-1 bg-primary/10 text-[10px] text-primary"
                  >
                    {asset.condition === "Damaged" ? (
                      <AlertTriangle className="size-2.5" />
                    ) : (
                      <Wrench className="size-2.5" />
                    )}
                    {asset.condition}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
