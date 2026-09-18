import type { Metadata } from "next"

import { AssetFormPage } from "@/components/assets/asset-form-page"

export const metadata: Metadata = {
  title: "Edit Asset — IT Helpdesk",
}

export default async function EditAssetPage(
  props: PageProps<"/assets/[id]/edit">
) {
  const { id } = await props.params
  const parsed = Number.parseInt(id, 10)

  return <AssetFormPage assetId={Number.isFinite(parsed) ? parsed : -1} />
}
