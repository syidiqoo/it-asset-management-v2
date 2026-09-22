"use client"

import { TriangleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
        <CardContent className="space-y-2.5">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Failed to load data</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {error}
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (empty) return null

  return <>{children}</>
}
