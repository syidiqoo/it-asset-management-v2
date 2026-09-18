import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type Stat = {
  label: string
  value: number
  icon?: LucideIcon
  dotClassName?: string
}

const COLUMNS = {
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-5",
}

export function StatGrid({
  stats,
  columns = 4,
}: {
  stats: Stat[]
  columns?: 4 | 5
}) {
  return (
    <div className={cn("grid gap-3", COLUMNS[columns])}>
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardContent className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {stat.value}
              </p>
            </div>
            {stat.icon ? (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="size-4" />
              </div>
            ) : stat.dotClassName ? (
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  stat.dotClassName
                )}
              />
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
