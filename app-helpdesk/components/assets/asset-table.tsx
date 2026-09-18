"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Inbox, Plus } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AssetPreviewDialog } from "@/components/assets/asset-preview-dialog"
import { DocumentPreviewDialog } from "@/components/assets/document-preview-dialog"
import { MoveAssetDialog } from "@/components/assets/move-asset-dialog"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { departmentName } from "@/lib/departments"
import { CONDITION_BADGE_CLASS, formatDate } from "@/lib/format"
import type { Asset } from "@/lib/types"
import { cn } from "@/lib/utils"

function ImageCell({ asset }: { asset: Asset }) {
  const [failed, setFailed] = React.useState(false)

  if (!asset.imageUrl || failed) {
    return <span className="text-muted-foreground">—</span>
  }

  const url = asset.imageUrl

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label={`View image for ${asset.name}`}
    >
      <img
        src={url}
        alt=""
        className="size-10 rounded-md border object-cover"
        onError={() => setFailed(true)}
      />
    </a>
  )
}

function DocumentCell({
  asset,
  onPreview,
}: {
  asset: Asset
  onPreview: (url: string, name: string) => void
}) {
  if (!asset.docUrl) {
    return <span className="text-muted-foreground">—</span>
  }

  const url = asset.docUrl

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={(event) => {
        event.stopPropagation()
        onPreview(url, asset.name)
      }}
    >
      <FileText />
      PDF
    </Button>
  )
}

export function AssetTable({ assets }: { assets: Asset[] }) {
  const store = useDataStore()
  const [preview, setPreview] = React.useState<Asset | null>(null)
  const [moveTarget, setMoveTarget] = React.useState<Asset | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<Asset | null>(null)
  const [document, setDocument] = React.useState<{
    url: string
    name: string
  } | null>(null)

  const categoryName = (id: number) =>
    store.categories.find((category) => category.id === id)?.name ?? "—"

  const employeeName = (id: number | null) =>
    id === null
      ? "—"
      : (store.employees.find((employee) => employee.id === id)?.name ?? "—")

  const departmentLabel = (id: number | null) =>
    departmentName(store.departments, id) ?? "—"

  if (assets.length === 0) {
    return (
      <Card size="sm">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No assets found</p>
            <p className="text-sm text-muted-foreground">
              Change keywords or reset filters to see other data.
            </p>
          </div>
          <Button size="sm" render={<Link href="/assets/new" />}>
            <Plus />
            Add Asset
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card size="sm" className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Category</TableHead>
                <TableHead>Asset Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Latest Update</TableHead>
                <TableHead className="pr-4">Purchase Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow
                  key={asset.id}
                  className="cursor-pointer"
                  onClick={() => setPreview(asset)}
                >
                  <TableCell className="pl-4">
                    <Badge variant="secondary">
                      {categoryName(asset.categoryId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {asset.code}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.serialNumber ?? "—"}
                  </TableCell>
                  <TableCell>{employeeName(asset.employeeId)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {departmentLabel(asset.departmentId)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(CONDITION_BADGE_CLASS[asset.condition])}
                    >
                      {asset.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ImageCell asset={asset} />
                  </TableCell>
                  <TableCell>
                    <DocumentCell
                      asset={asset}
                      onPreview={(url, name) => setDocument({ url, name })}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.updatedBy ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(asset.updatedAt)}
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">
                    {asset.purchaseDate ? formatDate(asset.purchaseDate) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AssetPreviewDialog
        asset={preview}
        onClose={() => setPreview(null)}
        onDelete={(asset) => {
          setPreview(null)
          setPendingDelete(asset)
        }}
        onMove={(asset) => {
          setPreview(null)
          setMoveTarget(asset)
        }}
      />

      <MoveAssetDialog asset={moveTarget} onClose={() => setMoveTarget(null)} />

      <DocumentPreviewDialog
        url={document?.url ?? null}
        title={document?.name}
        onClose={() => setDocument(null)}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Delete this asset?"
        description={
          <>
            Asset{" "}
            <span className="font-medium text-foreground">
              {pendingDelete?.name}
            </span>{" "}
            will be removed from the list. This action cannot be undone.
          </>
        }
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await store.deleteAsset(pendingDelete.id)
            } catch {
              return
            }
          }
          setPendingDelete(null)
        }}
      />
    </>
  )
}
