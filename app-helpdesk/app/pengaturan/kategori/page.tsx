import type { Metadata } from "next"

import { CategoryView } from "@/components/pengaturan/category-view"

export const metadata: Metadata = {
  title: "Kategori — IT Helpdesk",
}

export default function CategoryPage() {
  return <CategoryView />
}
