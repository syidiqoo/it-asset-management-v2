"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { AssetSection } from "@/components/assets/asset-section"
import { CsvActions } from "@/components/csv-actions"
import { useDataStore } from "@/components/data-store"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { Button } from "@/components/ui/button"
import { CSV_IMPORT_COLUMNS, assetSection, filterAssets } from "@/lib/assets"
import { csvFileName, downloadCsv } from "@/lib/csv"
import {
  collectDescendantIds,
  departmentPath,
  flattenDepartments,
} from "@/lib/departments"
import {
  type FilterField,
  type FilterValues,
} from "@/lib/filters"
import { CONDITIONS } from "@/lib/types"

const CSV_HEADER = [
  "Asset Name",
  "Code",
  "Serial Number",
  "Category",
  "Employee",
  "Department",
  "Condition",
  "Latest Update",
  "Purchase Date",
  "Note",
]

export function AssetsView({
  values,
}: {
  values: FilterValues
}) {
  const store = useDataStore()

  const departmentIds = React.useMemo(
    () =>
      values.department
        ? collectDescendantIds(store.departments, Number(values.department))
        : null,
    [store.departments, values.department]
  )

  const employeeName = React.useCallback(
    (id: number | null) =>
      id === null
        ? ""
        : (store.employees.find((employee) => employee.id === id)?.name ?? ""),
    [store.employees]
  )

  const filtered = React.useMemo(
    () => filterAssets(store.assets, values, { departmentIds, employeeName }),
    [store.assets, values, departmentIds, employeeName]
  )

  const fields: FilterField[] = [
    {
      type: "search",
      name: "q",
      label: "Search",
      placeholder: "Name, code, serial, employee",
    },
    {
      type: "select",
      name: "category",
      label: "Category",
      allLabel: "All categories",
      options: store.categories.map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    },
    {
      type: "select",
      name: "condition",
      label: "Condition",
      allLabel: "All conditions",
      options: CONDITIONS.map((condition) => ({
        label: condition,
        value: condition,
      })),
    },
    {
      type: "select",
      name: "department",
      label: "Department",
      allLabel: "All departments",
      options: flattenDepartments(store.departments).map((department) => ({
        label: department.path,
        value: String(department.id),
      })),
    },
  ]

  const available = React.useMemo(
    () => filtered.filter((asset) => assetSection(asset) === "available"),
    [filtered]
  )
  const main = React.useMemo(
    () => filtered.filter((asset) => assetSection(asset) === "main"),
    [filtered]
  )
  const broken = React.useMemo(
    () => filtered.filter((asset) => assetSection(asset) === "broken"),
    [filtered]
  )

  const exportCsv = () => {
    downloadCsv(
      csvFileName("asset-data"),
      CSV_HEADER,
      filtered.map((asset) => [
        asset.name,
        asset.code,
        asset.serialNumber ?? "",
        store.categories.find((item) => item.id === asset.categoryId)?.name ??
          "",
        employeeName(asset.employeeId),
        departmentPath(store.departments, asset.departmentId) ?? "",
        asset.condition,
        asset.updatedAt,
        asset.purchaseDate ?? "",
        asset.note ?? "",
      ])
    )
  }

  const importCsv = async (rows: string[][]) => {
    return store.importAssets(rows)
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Asset Data"
          description="Manage office IT assets with conditions and holders."
          actions={
            <>
              <CsvActions
                columns={CSV_IMPORT_COLUMNS}
                onExport={exportCsv}
                fileHint="App columns or the sample format (No, Kategori Inventaris, Asset Name, ...). User/Username columns are ignored."
                note="Import is all-or-nothing: one bad row cancels the whole process. Rows whose Asset Code already exists are skipped; duplicate codes inside one file are rejected."
                onImport={importCsv}
              />
              <Button size="sm" render={<Link href="/assets/new" />}>
                <Plus />
                Add Asset
              </Button>
            </>
          }
        />
        <FilterBar fields={fields} values={values} />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <StoreState
          loading={store.loading}
          error={store.error}
          onRetry={store.refresh}
          empty={false}
        >
          <div className="contents">
        <AssetSection
          title="Main Asset"
          description="Assets currently assigned to an employee."
          assets={main}
          unit="assets"
        />

        <AssetSection
          title="Available Asset"
          description="Unassigned stock in Good or Fair condition."
          assets={available}
          unit="available assets"
          defaultOpen={false}
        />

        <AssetSection
          title="Broken Asset"
          description="Assets that are Damaged or Under Repair."
          assets={broken}
          unit="broken assets"
          defaultOpen={false}
        />
          </div>
        </StoreState>
      </div>
    </div>
  )
}
