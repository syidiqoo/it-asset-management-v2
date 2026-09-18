"use client"

import Link from "next/link"
import { ArrowLeft, PackageX } from "lucide-react"

import { AssetForm } from "@/components/assets/asset-form"
import { useDataStore } from "@/components/data-store"
import { StoreState } from "@/components/store-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function AssetFormPage({ assetId }: { assetId?: number }) {
  const store = useDataStore()
  const asset =
    assetId === undefined
      ? undefined
      : store.assets.find((item) => item.id === assetId)
  const missing =
    !store.loading && !store.error && assetId !== undefined && asset === undefined

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit text-muted-foreground"
          render={<Link href="/assets" />}
        >
          <ArrowLeft />
          Asset Data
        </Button>
        <PageHeader
          title={assetId === undefined ? "Add Asset" : "Edit Asset"}
          description={
            assetId === undefined
              ? "Fill in new asset data with supporting files."
              : "Update asset data then save changes."
          }
        />
      </div>

      <StoreState
        loading={store.loading}
        error={store.error}
        onRetry={store.refresh}
        empty={false}
      >
        {missing ? (
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PackageX className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Asset not found</p>
                <p className="text-sm text-muted-foreground">
                  Asset data with ID {assetId} is unavailable.
                </p>
              </div>
              <Button size="sm" render={<Link href="/assets" />}>
                <ArrowLeft />
                Back to Asset Data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AssetForm key={asset?.id ?? "new"} asset={asset} />
        )}
      </StoreState>
    </div>
  )
}
