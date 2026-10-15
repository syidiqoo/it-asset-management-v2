import { CONDITIONS, type Asset, type Condition } from "@/lib/types"

export const CONDITION_HEX: Record<Condition, string> = {
  Good: "#4aa8c4",
  Fair: "#1282a2",
  Damaged: "#034078",
  "Under Repair": "#001f54",
}

function emptyConditionCounts(): Record<Condition, number> {
  return Object.fromEntries(
    CONDITIONS.map((condition) => [condition, 0])
  ) as Record<Condition, number>
}

export function conditionCounts(assets: Asset[]): Record<Condition, number> {
  const result = emptyConditionCounts()
  for (const asset of assets) result[asset.condition] += 1
  return result
}

export function percent(value: number, total: number): string {
  return total === 0 ? "0%" : `${((value / total) * 100).toFixed(1)}%`
}
