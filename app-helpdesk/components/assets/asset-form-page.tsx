"use client"

import Link from "next/link"
import { ArrowLeft, PackageX } from "lucide-react"

import { AssetForm } from "@/components/assets/asset-form"
import { useDataStore } from "@/components/data-store"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function AssetFormPage({ assetId }: { assetId?: number }) {
  const store = useDataStore()
  const asset =
    assetId === undefined
      ? undefined
      : store.assets.find((item) => item.id === assetId)
  const missing = assetId !== undefined && asset === undefined

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
          Data Aset
        </Button>
        <PageHeader
          title={assetId === undefined ? "Tambah Aset" : "Edit Aset"}
          description={
            assetId === undefined
              ? "Lengkapi data aset baru beserta berkas pendukungnya."
              : "Perbarui data aset lalu simpan perubahannya."
          }
        />
      </div>

      {missing ? (
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PackageX className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Aset tidak ditemukan</p>
              <p className="text-sm text-muted-foreground">
                Data aset dengan ID {assetId} tidak tersedia.
              </p>
            </div>
            <Button size="sm" render={<Link href="/assets" />}>
              <ArrowLeft />
              Kembali ke Data Aset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AssetForm key={asset?.id ?? "new"} asset={asset} />
      )}
    </div>
  )
}
