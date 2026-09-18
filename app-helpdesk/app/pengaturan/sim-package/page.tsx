import type { Metadata } from "next"

import { SimPackageView } from "@/components/pengaturan/sim-package-view"

export const metadata: Metadata = {
  title: "SIM Package — IT Helpdesk",
}

export default function SimPackagePage() {
  return <SimPackageView />
}
