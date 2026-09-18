"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { AssetTable } from "@/components/assets/asset-table"
import { CsvActions } from "@/components/csv-actions"
import { useDataStore } from "@/components/data-store"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { Pagination } from "@/components/pagination"
import { StickyHeader } from "@/components/sticky-header"
import { Button } from "@/components/ui/button"
import { ASSET_PAGE_SIZE, CSV_IMPORT_COLUMNS, filterAssets } from "@/lib/assets"
import { csvFileName, downloadCsv } from "@/lib/csv"
import {
  collectDescendantIds,
  departmentPath,
  flattenDepartments,
} from "@/lib/departments"
import {
  buildFilterQuery,
  type FilterField,
  type FilterValues,
} from "@/lib/filters"
import { CONDITIONS } from "@/lib/types"

const CSV_HEADER = [
  "Nama Aset",
  "Code",
  "Serial Number",
  "Kategori",
  "Employee",
  "Department",
  "Condition",
  "Record Date",
  "Purchase Date",
  "Note",
]

export function AssetsView({
  values,
  page: requestedPage,
}: {
  values: FilterValues
  page: number
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
      label: "Pencarian",
      placeholder: "Nama, code, serial, employee",
    },
    {
      type: "select",
      name: "category",
      label: "Kategori",
      allLabel: "Semua kategori",
      options: store.categories.map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    },
    {
      type: "select",
      name: "condition",
      label: "Kondisi",
      allLabel: "Semua kondisi",
      options: CONDITIONS.map((condition) => ({
        label: condition,
        value: condition,
      })),
    },
    {
      type: "select",
      name: "department",
      label: "Department",
      allLabel: "Semua department",
      options: flattenDepartments(store.departments).map((department) => ({
        label: department.path,
        value: String(department.id),
      })),
    },
  ]

  const pageCount = Math.max(1, Math.ceil(filtered.length / ASSET_PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount)
  const pageItems = filtered.slice(
    (page - 1) * ASSET_PAGE_SIZE,
    page * ASSET_PAGE_SIZE
  )

  const buildHref = (target: number) => {
    const query = buildFilterQuery(values, target)
    return query ? `/assets?${query}` : "/assets"
  }

  const exportCsv = () => {
    downloadCsv(
      csvFileName("data-aset"),
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
        asset.recordDate,
        asset.purchaseDate ?? "",
        asset.note ?? "",
      ])
    )
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Data Aset"
          description="Kelola aset IT kantor beserta kondisi dan pemegangnya."
          actions={
            <>
              <CsvActions
                columns={CSV_IMPORT_COLUMNS}
                onExport={exportCsv}
                fileHint="Nilai Kategori, Department, dan Employee harus sudah ada di master data."
                note="Import bersifat semua-atau-batal: satu baris bermasalah akan membatalkan seluruh proses. Penulisan ke database belum aktif pada tahap UI ini."
              />
              <Button size="sm" render={<Link href="/assets/new" />}>
                <Plus />
                Tambah Aset
              </Button>
            </>
          }
        />
        <FilterBar fields={fields} values={values} />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <AssetTable assets={pageItems} />

        {filtered.length > 0 ? (
          <Pagination
            page={page}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={ASSET_PAGE_SIZE}
            unit="aset"
            buildHref={buildHref}
          />
        ) : null}
      </div>
    </div>
  )
}
