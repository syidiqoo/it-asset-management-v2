import pkg from "@/package.json"

import { Sidebar } from "@/components/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh flex-col bg-muted/30 md:flex-row">
      <Sidebar version={pkg.version} />
      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
        tabIndex={0}
      >
        {children}
      </main>
    </div>
  )
}
