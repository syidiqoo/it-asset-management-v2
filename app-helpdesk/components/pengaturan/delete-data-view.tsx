"use client"

import * as React from "react"

import { Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { useDataStore } from "@/components/data-store"
import { PageHeader } from "@/components/page-header"
import { ResetDataDialog } from "@/components/pengaturan/reset-data-dialog"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function CountStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function DeleteDataView() {
  const store = useDataStore()
  const [open, setOpen] = React.useState(false)
  const [lastBackup, setLastBackup] = React.useState<string | null>(null)

  const counts = {
    asset: store.assets.length,
    simCard: store.simCards.length,
    internetData: store.internetData.length,
  }

  const reset = async (): Promise<string | null> => {
    try {
      const result = await store.resetData("REMOVE ALL DATA")
      setOpen(false)
      setLastBackup(result.backupName)
      toast.success(
        `Deleted ${result.deleted.asset} assets, ${result.deleted.simCard} SIM cards and ${result.deleted.internetData} internet records.`
      )
      return null
    } catch (error) {
      return error instanceof Error ? error.message : "Delete failed."
    }
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Delete Data"
          description="Remove all transactional data and start fresh. Master data is kept."
        />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <StoreState
          loading={store.loading}
          error={store.error}
          onRetry={store.refresh}
          empty={false}
        >
          <Card>
            <CardHeader>
              <CardTitle>Remove all transactional data</CardTitle>
              <CardDescription>
                Clears assets, SIM cards, internet records and asset file history.
                Categories, departments, positions, locations, SIM packages, user
                accounts and documentation are kept.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <CountStat label="Assets" value={counts.asset} />
                <CountStat label="SIM cards" value={counts.simCard} />
                <CountStat label="Internet records" value={counts.internetData} />
              </div>

              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>This action cannot be undone</AlertTitle>
                <AlertDescription>
                  A backup file is created automatically before the data is
                  removed. You must type &quot;REMOVE ALL DATA&quot; to confirm.
                </AlertDescription>
              </Alert>

              <Button variant="destructive" onClick={() => setOpen(true)}>
                <Trash2 />
                Delete Data
              </Button>

              {lastBackup ? (
                <p className="text-sm text-muted-foreground">
                  Backup created:{" "}
                  <a
                    className="font-medium underline underline-offset-3"
                    href={`/api/settings/reset-data/backups/${lastBackup}`}
                  >
                    {lastBackup}
                  </a>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </StoreState>
      </div>

      <ResetDataDialog
        open={open}
        onOpenChange={setOpen}
        counts={counts}
        onConfirm={reset}
      />
    </div>
  )
}
