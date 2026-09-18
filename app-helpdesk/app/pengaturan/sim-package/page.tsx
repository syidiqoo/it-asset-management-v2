import type { Metadata } from "next"

import { SimPackageView } from "@/components/pengaturan/sim-package-view"

export const metadata: Metadata = {
  title: "Package SIM — IT Helpdesk",
}

export default function SimPackagePage() {
  return <SimPackageView />
}
