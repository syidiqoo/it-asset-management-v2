import type { Metadata } from "next"

import { DepartmentView } from "@/components/pengaturan/department-view"
import { parseFilterValues } from "@/lib/filters"
import { DEPARTMENT_FILTER_NAMES } from "@/lib/master-data"

export const metadata: Metadata = {
  title: "Department — IT Helpdesk",
}

export default async function DepartmentPage(
  props: PageProps<"/pengaturan/department">
) {
  const searchParams = await props.searchParams
  const { values } = parseFilterValues(searchParams, DEPARTMENT_FILTER_NAMES)

  return <DepartmentView values={values} />
}
