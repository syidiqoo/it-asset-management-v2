import type { Metadata } from "next"

import { CategoryView } from "@/components/pengaturan/category-view"
import { parseFilterValues } from "@/lib/filters"
import { CATEGORY_FILTER_NAMES } from "@/lib/master-data"

export const metadata: Metadata = {
  title: "Category — IT Helpdesk",
}

export default async function CategoryPage(
  props: PageProps<"/pengaturan/kategori">
) {
  const searchParams = await props.searchParams
  const { values } = parseFilterValues(searchParams, CATEGORY_FILTER_NAMES)

  return <CategoryView values={values} />
}
