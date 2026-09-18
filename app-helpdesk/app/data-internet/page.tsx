import type { Metadata } from "next"

import { DataInternetView } from "@/components/data-internet/data-internet-view"
import { parseFilterValues } from "@/lib/filters"
import { INTERNET_FILTER_NAMES } from "@/lib/internet"

export const metadata: Metadata = {
  title: "Data Internet — IT Helpdesk",
}

export default async function DataInternetPage(
  props: PageProps<"/data-internet">
) {
  const searchParams = await props.searchParams
  const { values, page } = parseFilterValues(searchParams, INTERNET_FILTER_NAMES)

  return <DataInternetView values={values} page={page} />
}
