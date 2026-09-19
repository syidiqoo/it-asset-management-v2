import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  hint,
  progress,
  icon: Icon,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  progress?: number
  icon?: LucideIcon
  className?: string
}) {
  return (
    <Card size="sm" className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-3.5" />
            </span>
          ) : null}
        </div>

        <p className="text-2xl font-semibold tabular-nums">{value}</p>

        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}

        {progress === undefined ? null : (
          <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-muted pt-0">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
