import { Sidebar } from "@/components/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh flex-col bg-muted/30 md:flex-row">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
