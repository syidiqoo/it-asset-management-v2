import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { DataStoreProvider } from "@/components/data-store"
import { TooltipProvider } from "@/components/ui/tooltip"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "IT Helpdesk — Manajemen Aset IT",
  description:
    "Aplikasi manajemen aset IT kantor dan inventaris SIM card.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <DataStoreProvider>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </DataStoreProvider>
      </body>
    </html>
  )
}
