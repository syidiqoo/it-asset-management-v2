import type { Metadata } from "next"

import { LocationView } from "@/components/pengaturan/location-view"

export const metadata: Metadata = {
  title: "Location — IT Helpdesk",
}

export default function LocationPage() {
  return <LocationView />
}
