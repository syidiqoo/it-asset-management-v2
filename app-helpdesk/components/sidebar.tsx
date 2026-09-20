"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Boxes,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  MonitorSmartphone,
  Settings,
  Smartphone,
  Wifi,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSessionUser, useSignOut } from "@/components/use-session-user"
import { ROLE_LABEL } from "@/lib/users"
import { cn } from "@/lib/utils"

const SETTINGS_PREFIX = "/pengaturan"

const MAIN_ITEMS: {
  href: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Asset Data", icon: Boxes },
  { href: "/sim-cards", label: "SIM Card", icon: Smartphone },
  { href: "/data-internet", label: "Internet Data", icon: Wifi },
  { href: "/dokumentasi", label: "Dokumentasi", icon: BookOpen },
  { href: "/bast", label: "BAST", icon: FileText, adminOnly: true },
]

const SETTINGS_ITEMS: { href: string; label: string }[] = [
  { href: `${SETTINGS_PREFIX}/kategori`, label: "Category" },
  { href: `${SETTINGS_PREFIX}/employee`, label: "Employee" },
  { href: `${SETTINGS_PREFIX}/department`, label: "Department" },
  { href: `${SETTINGS_PREFIX}/sim-package`, label: "SIM Package" },
  { href: `${SETTINGS_PREFIX}/location`, label: "Location" },
  { href: `${SETTINGS_PREFIX}/user`, label: "User" },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

const itemClassName = (active: boolean) =>
  cn(
    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
  )

const subItemClassName = (active: boolean) =>
  cn(
    "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors",
    active
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
  )

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <MonitorSmartphone className="size-4" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">IT Helpdesk</p>
        <p className="text-xs text-muted-foreground">IT Asset Management</p>
      </div>
    </div>
  )
}

function MainLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
}) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={itemClassName(active)}>
      <Icon className="size-4 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  )
}

function SettingsToggle({
  expanded,
  active,
  onToggle,
}: {
  expanded: boolean
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={itemClassName(active)}
    >
      <Settings className="size-4 shrink-0" />
      <span className="whitespace-nowrap">Settings</span>
      <ChevronDown
        className={cn(
          "ml-auto size-4 shrink-0 transition-transform",
          expanded && "rotate-180"
        )}
      />
    </button>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const sessionUser = useSessionUser()
  const signOut = useSignOut()
  const [override, setOverride] = React.useState<{
    path: string
    open: boolean
  } | null>(null)

  const settingsActive = pathname.startsWith(SETTINGS_PREFIX)
  const settingsExpanded =
    override?.path === pathname ? override.open : settingsActive

  const toggleSettings = () =>
    setOverride({ path: pathname, open: !settingsExpanded })

  const isAdmin = sessionUser?.role === "admin"
  const mainItems = MAIN_ITEMS.filter((item) => !item.adminOnly || isAdmin)
  const showSettings = isAdmin
  const initials =
    (sessionUser?.name ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "—"

  return (
    <>
      <header className="z-30 flex shrink-0 flex-col gap-2 border-b bg-sidebar px-4 py-3 md:hidden">
        <Brand />
        <nav className="flex items-center gap-1 overflow-x-auto">
          {mainItems.map((item) => (
            <MainLink
              key={item.href}
              {...item}
              active={isActive(pathname, item.href)}
            />
          ))}
          {showSettings ? (
            <SettingsToggle
              expanded={settingsExpanded}
              active={settingsActive}
              onToggle={toggleSettings}
            />
          ) : null}
        </nav>
        {showSettings && settingsExpanded ? (
          <nav className="flex items-center gap-1 overflow-x-auto">
            {SETTINGS_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={subItemClassName(pathname === item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r bg-sidebar px-3 py-4 md:flex">
        <div className="px-1.5">
          <Brand />
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {mainItems.map((item) => (
            <MainLink
              key={item.href}
              {...item}
              active={isActive(pathname, item.href)}
            />
          ))}

          {showSettings ? (
            <SettingsToggle
              expanded={settingsExpanded}
              active={settingsActive}
              onToggle={toggleSettings}
            />
          ) : null}

          {showSettings && settingsExpanded ? (
            <div className="mt-1 ml-4 flex flex-col gap-0.5 border-l pl-2">
              {SETTINGS_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={subItemClassName(pathname === item.href)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </nav>

        <div className="border-t pt-3">
          <div className="flex items-center gap-2.5 px-1.5 pb-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{sessionUser?.name ?? "—"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {sessionUser ? ROLE_LABEL[sessionUser.role] : "—"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={signOut}
          >
            <LogOut />
            Log out
          </Button>
        </div>
      </aside>
    </>
  )
}
