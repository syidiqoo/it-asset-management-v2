import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  href?: string
  className?: string
}) {
  const content = (
    <Card
      size="sm"
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden border transition-all duration-150 hover:border-accent/40 hover:shadow-sm",
        href && "cursor-pointer",
        className
      )}
    >
      {/* Subtle top indicator line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-accent" />

      <CardContent className="flex flex-col gap-2 p-3.5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
          {Icon ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <Icon className="size-3.5" />
            </span>
          ) : null}
        </div>

        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
        </div>

        {hint ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full no-underline">
        {content}
      </Link>
    )
  }

  return content
}
