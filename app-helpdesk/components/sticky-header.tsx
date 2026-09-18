export function StickyHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="z-20 space-y-3 border-b bg-background px-4 py-3 md:sticky md:top-0 md:px-6">
      {children}
    </div>
  )
}
