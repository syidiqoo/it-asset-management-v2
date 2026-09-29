"use client"

import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Skeleton from "@mui/material/Skeleton"

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
      <Card variant="outlined">
        <CardContent className="space-y-2.5">
          <Skeleton variant="rounded" className="h-5 w-1/3" />
          <Skeleton variant="rounded" className="h-4 w-full" />
          <Skeleton variant="rounded" className="h-4 w-full" />
          <Skeleton variant="rounded" className="h-4 w-2/3" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Failed to load data</AlertTitle>
        <div className="flex flex-col items-start gap-3">
          {error}
          <Button size="small" variant="outlined" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </Alert>
    )
  }

  if (empty) return null

  return <>{children}</>
}
