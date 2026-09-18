import type { Metadata } from "next"

import { AssetFormPage } from "@/components/assets/asset-form-page"

export const metadata: Metadata = {
  title: "Tambah Aset — IT Helpdesk",
}

export default function NewAssetPage() {
  return <AssetFormPage />
}
