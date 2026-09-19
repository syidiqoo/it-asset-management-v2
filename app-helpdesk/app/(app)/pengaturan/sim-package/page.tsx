import type { Metadata } from "next"

import { SimPackageView } from "@/components/pengaturan/sim-package-view"
import { parseFilterValues } from "@/lib/filters"
import { SIM_PACKAGE_FILTER_NAMES } from "@/lib/master-data"

export const metadata: Metadata = {
  title: "SIM Package — IT Helpdesk",
}

export default async function SimPackagePage(
  props: PageProps<"/pengaturan/sim-package">
) {
  const searchParams = await props.searchParams
  const { values } = parseFilterValues(searchParams, SIM_PACKAGE_FILTER_NAMES)

  return <SimPackageView values={values} />
}
