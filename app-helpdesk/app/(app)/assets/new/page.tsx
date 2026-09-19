import type { Metadata } from "next"

import { AssetFormPage } from "@/components/assets/asset-form-page"

export const metadata: Metadata = {
  title: "Add Asset — IT Helpdesk",
}

export default function NewAssetPage() {
  return <AssetFormPage />
}
