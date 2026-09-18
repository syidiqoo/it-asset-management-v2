import type { Metadata } from "next"

import { DepartmentView } from "@/components/pengaturan/department-view"

export const metadata: Metadata = {
  title: "Department — IT Helpdesk",
}

export default function DepartmentPage() {
  return <DepartmentView />
}
