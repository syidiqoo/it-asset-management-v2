import type { Location } from "@/lib/types"

export const LOCATION_CODE_MIN = 1
export const LOCATION_CODE_MAX = 100

export function normalizeLocationCode(value: string): string {
  return value.trim().padStart(3, "0")
}

export function validateLocationCode(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return "Kode wajib diisi."
  if (!/^\d{1,3}$/.test(trimmed)) {
    return `Kode harus berupa angka ${LOCATION_CODE_MIN}–${LOCATION_CODE_MAX}.`
  }
  const numeric = Number(trimmed)
  if (numeric < LOCATION_CODE_MIN || numeric > LOCATION_CODE_MAX) {
    return `Kode harus di antara ${normalizeLocationCode(String(LOCATION_CODE_MIN))} dan ${LOCATION_CODE_MAX}.`
  }
  return null
}

export function formatCoordinates(location: Location): string {
  if (location.latitude === null || location.longitude === null) return "—"
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
}

export function formatLocationLabel(location: Location): string {
  const shortName = location.address.split(",")[0]?.trim() || location.address
  return `${location.code} — ${shortName}`
}

export function locationLabelById(
  locations: Location[],
  id: number | null
): string {
  if (id === null) return "—"
  const location = locations.find((item) => item.id === id)
  return location ? formatLocationLabel(location) : "—"
}
