"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildFilterQuery,
  hasActiveFilters,
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

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) =>
            field.type === "search" ? (
              <form
                key={field.name}
                onSubmit={(event) => {
                  event.preventDefault()
                  navigate({})
                }}
                className="space-y-1.5"
              >
                <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={`filter-${field.name}`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={field.placeholder}
                    className="pr-14 pl-8"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="xs"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                  >
                    Cari
                  </Button>
                </div>
              </form>
            ) : (
              <div key={field.name} className="space-y-1.5">
                <Label>{field.label}</Label>
                <Select
                  items={[
                    { label: field.allLabel, value: "" },
                    ...field.options,
                  ]}
                  value={values[field.name] ?? ""}
                  onValueChange={(value) =>
                    navigate({ [field.name]: value ?? "" })
                  }
                >
                  <SelectTrigger className="w-full">
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
              </div>
            )
          )}
        </div>

        {hasActiveFilters(values) ? (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={reset}>
              <X />
              Reset filter
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
