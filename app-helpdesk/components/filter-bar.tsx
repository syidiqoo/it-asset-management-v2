"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Lock, LockKeyhole, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildFilterQuery,
  getPinned,
  hasActiveFilters,
  setPinned,
  type FilterField,
  type FilterValues,
} from "@/lib/filters"

export function FilterBar({
  fields,
  values,
}: {
  fields: FilterField[]
  values: FilterValues
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pinned, setPinnedState] = React.useState(false)

  // Load pin state from sessionStorage after mount
  React.useEffect(() => {
    setPinnedState(getPinned(pathname))
  }, [pathname])

  // Restore pinned filters on mount when values are empty but pin exists
  const restored = React.useRef(false)
  React.useEffect(() => {
    if (pinned && !restored.current) {
      restored.current = true
      const params = new URLSearchParams(window.location.search)
      const hasFilters = fields.some((f) => params.has(f.name))
      if (!hasFilters) {
        const state = sessionStorage.getItem(`filter-state:${pathname}`)
        if (state && state !== window.location.search.slice(1)) {
          router.replace(`${pathname}?${state}`)
        }
      }
    }
  }, [pinned, pathname, fields, router])

  const searchField = fields.find((field) => field.type === "search")
  const searchName = searchField?.name
  const [query, setQuery] = React.useState(
    searchName ? (values[searchName] ?? "") : ""
  )

  const navigate = React.useCallback(
    (patch: FilterValues) => {
      const next = { ...values, ...patch }
      if (searchName) next[searchName] = query.trim()

      const search = buildFilterQuery(next, 1)
      router.push(search ? `${pathname}?${search}` : pathname)
    },
    [values, searchName, query, pathname, router]
  )

  const reset = () => {
    setQuery("")
    router.push(pathname)
  }

  const togglePin = () => {
    setPinnedState((prev) => {
      const next = !prev
      if (next) {
        setPinned(pathname, { ...values, [searchName ?? ""]: query.trim(), page: "1" })
      } else {
        setPinned(pathname, null)
      }
      return next
    })
  }

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex flex-wrap items-end gap-2">
          {fields.map((field) =>
            field.type === "search" ? (
              <form
                key={field.name}
                onSubmit={(event) => {
                  event.preventDefault()
                  navigate({})
                }}
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={`filter-${field.name}`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search"
                    className="h-9 w-56 pr-3 pl-8"
                  />
                </div>
              </form>
            ) : field.searchable ? (
              <Combobox
                key={field.name}
                items={field.options}
                value={values[field.name] ?? ""}
                onValueChange={(value) =>
                  navigate({ [field.name]: value ?? "" })
                }
                placeholder={field.allLabel}
                emptyLabel={field.allLabel}
                className="w-56"
              />
            ) : (
              <Select
                key={field.name}
                items={[
                  { label: field.allLabel, value: "" },
                  ...field.options,
                ]}
                value={values[field.name] ?? ""}
                onValueChange={(value) =>
                  navigate({ [field.name]: value ?? "" })
                }
              >
                <SelectTrigger className="h-9 w-56" aria-label={field.label}>
                  <SelectValue placeholder={field.allLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{field.allLabel}</SelectItem>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          )}

          <div className="flex items-center gap-1.5 pb-px">
            {hasActiveFilters(values) ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={reset}
                aria-label="Reset filters"
                className="size-8 rounded-md transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <X className="size-4" />
              </Button>
            ) : null}

            <button
              type="button"
              role="checkbox"
              aria-checked={pinned}
              aria-label={pinned ? "Filters locked" : "Lock filters"}
              onClick={togglePin}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-muted/80 hover:text-foreground aria-checked:bg-primary/10 aria-checked:text-primary"
            >
              {pinned ? <LockKeyhole className="size-4" /> : <Lock className="size-4" />}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
