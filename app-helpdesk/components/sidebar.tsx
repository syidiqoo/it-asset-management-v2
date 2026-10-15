"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
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
  { href: "/summary", label: "Summary", icon: ClipboardList, adminOnly: true },
  { href: "/dokumentasi", label: "Documentation", icon: BookOpen },
  { href: "/bast", label: "BAST", icon: FileText, adminOnly: true },
]

const SETTINGS_GROUPS: {
  group: string
  items: { href: string; label: string; destructive?: boolean }[]
}[] = [
  {
    group: "Master Data",
    items: [
      { href: `${SETTINGS_PREFIX}/kategori`, label: "Category" },
      { href: `${SETTINGS_PREFIX}/employee`, label: "Employee" },
      { href: `${SETTINGS_PREFIX}/department`, label: "Department" },
      { href: `${SETTINGS_PREFIX}/position`, label: "Position" },
      { href: `${SETTINGS_PREFIX}/location`, label: "Location" },
      { href: `${SETTINGS_PREFIX}/sim-package`, label: "SIM Package" },
    ],
  },
  {
    group: "System & Admin",
    items: [
      { href: `${SETTINGS_PREFIX}/user`, label: "User Access" },
      { href: `${SETTINGS_PREFIX}/backup-restore`, label: "Backup / Restore" },
      {
        href: `${SETTINGS_PREFIX}/delete-data`,
        label: "Delete Data",
        destructive: true,
      },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

const itemClassName = (active: boolean) =>
  cn(
    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
  )

const subItemClassName = (active: boolean, destructive?: boolean) =>
  cn(
    "rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors flex items-center justify-between",
    active
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : destructive
      ? "text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-300"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
  )

function Brand({ version }: { version: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-xs">
        <img
          src="/logo2.png"
          alt="IT Helpdesk"
          className="size-full object-cover"
        />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold leading-snug text-white">
          IT Helpdesk Asset Management
        </p>
        <p className="text-xs text-white/70">v{version}</p>
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

export function Sidebar({ version }: { version: string }) {
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
        <Brand version={version} />
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
            {SETTINGS_GROUPS.flatMap((g) => g.items).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={subItemClassName(pathname === item.href, item.destructive)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r bg-sidebar px-3 py-4 md:flex">
        <div className="px-1.5">
          <Brand version={version} />
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
            <div className="mt-1 ml-3 flex flex-col gap-2.5 border-l border-sidebar-border/60 pl-2">
              {SETTINGS_GROUPS.map((group) => (
                <div key={group.group} className="flex flex-col gap-0.5">
                  <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                    {group.group}
                  </span>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={subItemClassName(pathname === item.href, item.destructive)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </nav>

        <div className="border-t border-sidebar-border pt-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/5 p-2 border border-white/10 shadow-xs">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white shadow-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-white">{sessionUser?.name ?? "—"}</p>
              <p className="truncate text-[11px] font-medium text-slate-300">
                {sessionUser ? ROLE_LABEL[sessionUser.role] : "—"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            onClick={signOut}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  )
}
