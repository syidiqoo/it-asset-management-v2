import type { Metadata } from "next"

import { PositionView } from "@/components/pengaturan/position-view"
import { parseFilterValues } from "@/lib/filters"
import { POSITION_FILTER_NAMES } from "@/lib/master-data"

export const metadata: Metadata = {
  title: "Position — IT Helpdesk",
}

export default async function PositionPage(
  props: PageProps<"/pengaturan/position">
) {
  const searchParams = await props.searchParams
  const { values } = parseFilterValues(searchParams, POSITION_FILTER_NAMES)

  return <PositionView values={values} />
}
