import type { Metadata } from "next"

import { BastView } from "@/components/bast/bast-view"

export const metadata: Metadata = {
  title: "BAST — IT Helpdesk",
}

export default function BastPage() {
  return <BastView />
}
