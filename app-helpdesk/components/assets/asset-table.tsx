"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Inbox, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { departmentPath } from "@/lib/departments"
import { CONDITION_BADGE_CLASS, formatDate } from "@/lib/format"
import type { Asset } from "@/lib/types"
import { cn } from "@/lib/utils"

export function AssetTable({ assets }: { assets: Asset[] }) {
  const router = useRouter()
  const store = useDataStore()
  const [target, setTarget] = React.useState<Asset | null>(null)

  const categoryName = (id: number) =>
    store.categories.find((category) => category.id === id)?.name ?? "—"

  const employeeName = (id: number | null) =>
    id === null
      ? "—"
      : (store.employees.find((employee) => employee.id === id)?.name ?? "—")

  const departmentName = (id: number | null) =>
    departmentPath(store.departments, id) ?? "—"

  if (assets.length === 0) {
    return (
      <Card size="sm">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Tidak ada aset ditemukan</p>
            <p className="text-sm text-muted-foreground">
              Ubah kata kunci atau reset filter untuk melihat data lainnya.
            </p>
          </div>
          <Button size="sm" render={<Link href="/assets/new" />}>
            <Plus />
            Tambah Aset
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
                <TableHead className="pl-4">Kategori</TableHead>
                <TableHead>Nama Aset</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Record Date</TableHead>
                <TableHead className="pr-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
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
                    {departmentName(asset.departmentId)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(CONDITION_BADGE_CLASS[asset.condition])}
                    >
                      {asset.condition}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.updatedBy ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(asset.recordDate)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Aksi untuk ${asset.name}`}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/assets/${asset.id}/edit`)
                          }
                        >
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setTarget(asset)}
                        >
                          <Trash2 />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus aset ini?</DialogTitle>
            <DialogDescription>
              Aset{" "}
              <span className="font-medium text-foreground">
                {target?.name}
              </span>{" "}
              akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (target) store.deleteAsset(target.id)
                setTarget(null)
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
