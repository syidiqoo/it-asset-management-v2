"use client"

import * as React from "react"

import { useDataStore } from "@/components/data-store"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CONDITION_HEX, conditionCounts } from "@/lib/dashboard"
import { CONDITIONS } from "@/lib/types"

const DONUT_SIZE = 200
const DONUT_THICKNESS = 20

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
    const length = (segment.value / total) * circumference
    const offset = active
      .slice(0, index)
      .reduce(
        (sum, previous) => sum + (previous.value / total) * circumference,
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
          className="stroke-muted"
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
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">
          {centerValue}
        </span>
        <span className="text-xs text-muted-foreground">{centerLabel}</span>
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

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle>Asset Condition</CardTitle>
        <CardDescription>Condition mix of {totalAssets} assets</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
        <Donut
          segments={CONDITIONS.map((condition) => ({
            label: condition,
            value: totals[condition],
            color: CONDITION_HEX[condition],
          }))}
          centerValue={totalAssets}
          centerLabel="assets"
        />
        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5">
          {CONDITIONS.map((condition) => (
            <li key={condition} className="flex items-center gap-1.5 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CONDITION_HEX[condition] }}
              />
              <span className="truncate text-muted-foreground">
                {condition}
              </span>
              <span className="ml-auto font-medium tabular-nums">
                {totals[condition]}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
