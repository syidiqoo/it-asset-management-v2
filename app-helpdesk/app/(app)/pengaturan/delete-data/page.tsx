import type { Metadata } from "next"

import { DeleteDataView } from "@/components/pengaturan/delete-data-view"

export const metadata: Metadata = {
  title: "Delete Data — IT Helpdesk",
}

export default function DeleteDataPage() {
  return <DeleteDataView />
}
