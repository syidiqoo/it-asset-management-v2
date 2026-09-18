import type { Metadata } from "next"

import { CategoryView } from "@/components/pengaturan/category-view"

export const metadata: Metadata = {
  title: "Category — IT Helpdesk",
}

export default function CategoryPage() {
  return <CategoryView />
}
