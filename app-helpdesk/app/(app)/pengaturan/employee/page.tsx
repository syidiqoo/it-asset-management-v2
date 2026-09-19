import type { Metadata } from "next"

import { EmployeeView } from "@/components/pengaturan/employee-view"
import { parseFilterValues } from "@/lib/filters"
import { EMPLOYEE_FILTER_NAMES } from "@/lib/master-data"

export const metadata: Metadata = {
  title: "Employee — IT Helpdesk",
}

export default async function EmployeePage(
  props: PageProps<"/pengaturan/employee">
) {
  const searchParams = await props.searchParams
  const { values } = parseFilterValues(searchParams, EMPLOYEE_FILTER_NAMES)

  return <EmployeeView values={values} />
}
