"use client"

import * as React from "react"
import L from "leaflet"
import { Search } from "lucide-react"
import "leaflet/dist/leaflet.css"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const INDONESIA_CENTER: L.LatLngExpression = [-2.5, 118]
const INDONESIA_ZOOM = 5
const PIN_ZOOM = 15
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

type SearchResult = { lat: string; lon: string }

function createPinIcon() {
  return L.divIcon({
    className: "location-map-pin",
    html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#2563eb;border:2px solid #ffffff;box-shadow:0 1px 4px rgba(15,23,42,0.45)"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export function LocationMapPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null
  longitude: number | null
  onChange: (latitude: number, longitude: number) => void
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<L.Map | null>(null)
  const markerRef = React.useRef<L.Marker | null>(null)
  const onChangeRef = React.useRef(onChange)

  const initialRef = React.useRef({
    latitude,
    longitude,
  })

  const [query, setQuery] = React.useState("")
  const [searching, setSearching] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)

  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const runSearch = async () => {
    const term = query.trim()
    if (!term || searching) return

    setSearching(true)
    setSearchError(null)

    try {
      const response = await fetch(
        `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(term)}`,
        { headers: { Accept: "application/json" } }
      )
      if (!response.ok) throw new Error("request failed")

      const results = (await response.json()) as SearchResult[]
      const first = results[0]
      const foundLatitude = first ? Number(first.lat) : NaN
      const foundLongitude = first ? Number(first.lon) : NaN

      if (!Number.isFinite(foundLatitude) || !Number.isFinite(foundLongitude)) {
        setSearchError("Location not found.")
        return
      }

      onChangeRef.current(foundLatitude, foundLongitude)
      mapRef.current?.setView([foundLatitude, foundLongitude], PIN_ZOOM)
    } catch {
      setSearchError("Search failed. Check your internet connection.")
    } finally {
      setSearching(false)
    }
  }

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const start = initialRef.current
    const initialPosition =
      start.latitude !== null && start.longitude !== null
        ? ([start.latitude, start.longitude] as L.LatLngExpression)
        : null

    const map = L.map(containerRef.current, {
      center: initialPosition ?? INDONESIA_CENTER,
      zoom: initialPosition ? PIN_ZOOM : INDONESIA_ZOOM,
      scrollWheelZoom: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    map.on("click", (event: L.LeafletMouseEvent) => {
      onChangeRef.current(event.latlng.lat, event.latlng.lng)
    })

    mapRef.current = map

    const timers = [
      window.setTimeout(() => map.invalidateSize(), 150),
      window.setTimeout(() => map.invalidateSize(), 350),
    ]

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (latitude === null || longitude === null) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    const position: L.LatLngExpression = [latitude, longitude]

    if (markerRef.current) {
      markerRef.current.setLatLng(position)
    } else {
      const marker = L.marker(position, {
        icon: createPinIcon(),
        draggable: true,
      })
        .addTo(map)
        .on("dragend", () => {
          const moved = marker.getLatLng()
          onChangeRef.current(moved.lat, moved.lng)
        })
      markerRef.current = marker
    }

    map.panTo(position)
  }, [latitude, longitude])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              void runSearch()
            }
          }}
          placeholder="Search address or place…"
          aria-label="Search address or place"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void runSearch()}
          disabled={searching || query.trim() === ""}
        >
          <Search />
          {searching ? "Searching…" : "Search"}
        </Button>
      </div>

      <div ref={containerRef} className="h-56 w-full rounded-lg border" />

      {searchError ? (
        <p className="text-xs text-destructive">{searchError}</p>
      ) : null}
    </div>
  )
}
