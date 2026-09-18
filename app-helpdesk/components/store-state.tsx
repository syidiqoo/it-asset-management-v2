"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function StoreState({
  loading,
  error,
  onRetry,
  empty,
  children,
}: {
  loading: boolean
  error: string | null
  onRetry: () => void
  empty: boolean
  children: React.ReactNode
}) {
  if (loading) {
    return (
      <Card size="sm">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading data...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card size="sm">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm font-medium">Failed to load data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (empty) return null

  return <>{children}</>
}
