"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import FormControl from "@mui/material/FormControl"
import FormLabel from "@mui/material/FormLabel"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import OutlinedInput from "@mui/material/OutlinedInput"
import Select from "@mui/material/Select"

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
    <Card variant="outlined">
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
              >
                <FormControl fullWidth>
                  <FormLabel htmlFor={`filter-${field.name}`}>
                    {field.label}
                  </FormLabel>
                  <OutlinedInput
                    id={`filter-${field.name}`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={field.placeholder}
                    size="small"
                    startAdornment={
                      <InputAdornment position="start">
                        <Search className="size-3.5" />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <Button type="submit" size="small" variant="text">
                          Search
                        </Button>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </form>
            ) : (
              <FormControl key={field.name} fullWidth>
                <FormLabel htmlFor={`filter-${field.name}`}>
                  {field.label}
                </FormLabel>
                <Select
                  id={`filter-${field.name}`}
                  value={values[field.name] ?? ""}
                  onChange={(event) =>
                    navigate({ [field.name]: event.target.value })
                  }
                  displayEmpty
                  size="small"
                >
                  <MenuItem value="">{field.allLabel}</MenuItem>
                  {field.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )
          )}
        </div>

        {hasActiveFilters(values) ? (
          <div className="flex justify-end">
            <Button variant="text" size="small" onClick={reset}>
              <X className="size-4" />
              Reset filters
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
