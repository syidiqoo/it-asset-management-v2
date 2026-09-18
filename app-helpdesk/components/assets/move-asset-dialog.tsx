"use client"

import * as React from "react"
import { ArrowRightLeft } from "lucide-react"

import { useDataStore } from "@/components/data-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ASSET_SECTION_LABEL,
  assetSection,
  type AssetSectionKey,
} from "@/lib/assets"
import { CONDITIONS, type Asset, type Condition } from "@/lib/types"

const SECTION_ORDER: AssetSectionKey[] = ["available", "main", "broken"]

export function MoveAssetDialog({
  asset,
  onClose,
}: {
  asset: Asset | null
  onClose: () => void
}) {
  if (!asset) return null

  return (
    <MoveAssetForm key={asset.id} asset={asset} onClose={onClose} />
  )
}

function MoveAssetForm({
  asset,
  onClose,
}: {
  asset: Asset
  onClose: () => void
}) {
  const store = useDataStore()
  const [section, setSection] = React.useState<AssetSectionKey>(() =>
    assetSection(asset)
  )
  const [employeeId, setEmployeeId] = React.useState(
    asset.employeeId === null ? "" : String(asset.employeeId)
  )
  const [condition, setCondition] = React.useState<Condition>(asset.condition)
  const [error, setError] = React.useState<string | null>(null)

  const handleMove = async () => {
    if (section === "main" && !employeeId) {
      setError("Select an employee to assign this asset.")
      return
    }
    setError(null)

    try {
      await store.updateAsset(asset.id, {
        categoryId: asset.categoryId,
        name: asset.name,
        code: asset.code,
        serialNumber: asset.serialNumber,
        employeeId: section === "main" ? Number(employeeId) : null,
        departmentId: asset.departmentId,
        condition:
          section === "broken"
            ? condition === "Good" || condition === "Fair"
              ? "Damaged"
              : condition
            : section === "available"
              ? condition === "Damaged" || condition === "Under Repair"
                ? "Good"
                : condition
              : asset.condition,
        imageUrl: asset.imageUrl,
        docUrl: asset.docUrl,
        recordDate: asset.recordDate,
        purchaseDate: asset.purchaseDate,
        note: asset.note,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move failed.")
      return
    }
    onClose()
  }

  return (
    <Dialog
      open={asset !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {asset.name}</DialogTitle>
          <DialogDescription>
            Move this asset between Available, Main, and Broken stock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Destination</Label>
            <Select
              items={SECTION_ORDER.map((key) => ({
                label: ASSET_SECTION_LABEL[key],
                value: key,
              }))}
              value={section}
              onValueChange={(value) =>
                setSection((value as AssetSectionKey | null) ?? "available")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_ORDER.map((key) => (
                  <SelectItem key={key} value={key}>
                    {ASSET_SECTION_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {section === "main" ? (
            <div className="space-y-1.5">
              <Label>Assign to employee</Label>
              <Select
                items={[
                  { label: "Select employee", value: "" },
                  ...store.employees.map((employee) => ({
                    label: employee.name,
                    value: String(employee.id),
                  })),
                ]}
                value={employeeId}
                onValueChange={(value) => setEmployeeId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select employee</SelectItem>
                  {store.employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {section !== "main" ? (
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select
                items={CONDITIONS.map((item) => ({
                  label: item,
                  value: item,
                }))}
                value={condition}
                onValueChange={(value) =>
                  setCondition((value as Condition | null) ?? "Good")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove}>
            <ArrowRightLeft />
            Move Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
