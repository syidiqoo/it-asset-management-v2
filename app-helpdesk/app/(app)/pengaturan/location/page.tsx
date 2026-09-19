import type { Metadata } from "next"

import { LocationView } from "@/components/pengaturan/location-view"
import { parseFilterValues } from "@/lib/filters"
import { LOCATION_FILTER_NAMES } from "@/lib/master-data"

export const metadata: Metadata = {
  title: "Location — IT Helpdesk",
}

export default async function LocationPage(
  props: PageProps<"/pengaturan/location">
) {
  const searchParams = await props.searchParams
  const { values } = parseFilterValues(searchParams, LOCATION_FILTER_NAMES)

  return <LocationView values={values} />
}
