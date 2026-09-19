import { CONDITIONS, type Asset, type Condition } from "@/lib/types"

export const CONDITION_HEX: Record<Condition, string> = {
  Good: "#10b981",
  Fair: "#f59e0b",
  Damaged: "#ef4444",
  "Under Repair": "#3b82f6",
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
