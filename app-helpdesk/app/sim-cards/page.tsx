import type { Metadata } from "next"

import { SimCardsView } from "@/components/sim-cards/sim-cards-view"
import { parseFilterValues } from "@/lib/filters"
import { SIM_CARD_FILTER_NAMES } from "@/lib/sim-cards"

export const metadata: Metadata = {
  title: "SIM Card — IT Helpdesk",
}

export default async function SimCardsPage(props: PageProps<"/sim-cards">) {
  const searchParams = await props.searchParams
  const { values, page } = parseFilterValues(
    searchParams,
    SIM_CARD_FILTER_NAMES
  )

  return <SimCardsView values={values} page={page} />
}
