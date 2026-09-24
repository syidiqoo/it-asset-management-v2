import type { AssetFileHistory } from "@/lib/types"

export async function fetchAssetFileHistory(
  assetId: number
): Promise<AssetFileHistory> {
  const response = await fetch(`/api/assets/${assetId}/history`)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to load file history.")
  }
  return data as AssetFileHistory
}
