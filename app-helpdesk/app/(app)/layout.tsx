import { AppShell } from "@/components/app-shell"
import { DataStoreProvider } from "@/components/data-store"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataStoreProvider>
      <TooltipProvider>
        <AppShell>{children}</AppShell>
      </TooltipProvider>
    </DataStoreProvider>
  )
}
