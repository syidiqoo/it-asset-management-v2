import { AppShell } from "@/components/app-shell"
import { DataStoreProvider } from "@/components/data-store"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataStoreProvider>
      <TooltipProvider>
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" />
      </TooltipProvider>
    </DataStoreProvider>
  )
}
