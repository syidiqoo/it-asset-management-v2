"use client"

import * as React from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import type { Location } from "@/lib/types"

const INDONESIA_CENTER: L.LatLngExpression = [-2.5, 118]
const INDONESIA_ZOOM = 5
// Padding around Indonesia's extents (Sabang to Merauke, Rote to Weh).
const INDONESIA_BOUNDS = L.latLngBounds([-11.5, 94.0], [6.5, 141.8])

type PlottedLocation = Location & { latitude: number; longitude: number }

function createDotIcon() {
  return L.divIcon({
    className: "dashboard-map-dot",
    html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#2563eb;border:2px solid #ffffff;box-shadow:0 1px 4px rgba(15,23,42,0.45)"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  })
}

function createPopup(location: PlottedLocation) {
  const wrapper = document.createElement("div")
  wrapper.style.display = "flex"
  wrapper.style.flexDirection = "column"
  wrapper.style.gap = "2px"

  const code = document.createElement("p")
  code.style.margin = "0"
  code.style.fontWeight = "600"
  code.textContent = location.code
  wrapper.append(code)

  const name = location.address?.trim()
  if (name) {
    const nameLine = document.createElement("p")
    nameLine.style.margin = "0"
    nameLine.style.maxWidth = "220px"
    nameLine.style.fontWeight = "600"
    nameLine.style.fontSize = "12px"
    nameLine.textContent = name
    wrapper.append(nameLine)
  }

  const address = document.createElement("p")
  address.style.margin = "0"
  address.style.maxWidth = "220px"
  address.style.fontSize = "12px"
  if (name) address.style.color = "#64748b"
  address.textContent = location.detailStreetAddress
  wrapper.append(address)

  return wrapper
}

export function DashboardMap({ locations }: { locations: Location[] }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<L.Map | null>(null)

  const points = React.useMemo(
    () =>
      locations.filter(
        (location): location is PlottedLocation =>
          location.latitude !== null && location.longitude !== null
      ),
    [locations]
  )

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: INDONESIA_CENTER,
      zoom: INDONESIA_ZOOM,
      minZoom: INDONESIA_ZOOM,
      maxBounds: INDONESIA_BOUNDS,
      maxBoundsViscosity: 1,
      scrollWheelZoom: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      noWrap: true,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const icon = createDotIcon()
    const layer = L.layerGroup()

    for (const point of points) {
      L.marker([point.latitude, point.longitude], { icon })
        .bindPopup(createPopup(point))
        .addTo(layer)
    }

    layer.addTo(map)

    if (points.length > 0) {
      map.fitBounds(
        L.latLngBounds(
          points.map((point) => [point.latitude, point.longitude])
        ),
        { padding: [48, 48], maxZoom: 13 }
      )
    }

    return () => {
      layer.remove()
    }
  }, [points])

  return <div ref={containerRef} className="h-80 w-full md:h-96" />
}
