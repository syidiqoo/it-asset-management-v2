import type { Metadata } from "next"

import { AssetsView } from "@/components/assets/assets-view"
import { ASSET_FILTER_NAMES } from "@/lib/assets"
import { parseFilterValues } from "@/lib/filters"

export const metadata: Metadata = {
  title: "Data Aset — IT Helpdesk",
}

export default async function AssetsPage(props: PageProps<"/assets">) {
  const searchParams = await props.searchParams
  const { values, page } = parseFilterValues(searchParams, ASSET_FILTER_NAMES)

  return <AssetsView values={values} page={page} />
}
