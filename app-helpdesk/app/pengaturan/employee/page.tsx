import type { Metadata } from "next"

import { EmployeeView } from "@/components/pengaturan/employee-view"

export const metadata: Metadata = {
  title: "Employee — IT Helpdesk",
}

export default function EmployeePage() {
  return <EmployeeView />
}
