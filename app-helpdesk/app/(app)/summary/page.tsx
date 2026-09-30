import type { Metadata } from "next"

import { SummaryView } from "@/components/summary/summary-view"

export const metadata: Metadata = {
  title: "Summary — IT Helpdesk",
}

export default function SummaryPage() {
  return <SummaryView />
}
