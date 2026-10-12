"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { cn } from "cn"

export type ComboboxItem = { value: string; label: string }

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder,
  emptyLabel,
  emptyText = "Tidak ada data.",
  id,
  disabled,
  className,
}: {
  items: ComboboxItem[]
  value: string
  onValueChange: (value: string | null) => void
  placeholder?: string
  emptyLabel?: string
  emptyText?: string
  id?: string
  disabled?: boolean
  className?: string
}) {
  const labelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    if (emptyLabel !== undefined) map.set("", emptyLabel)
    for (const item of items) map.set(item.value, item.label)
    return map
  }, [items, emptyLabel])

  const values = React.useMemo(
    () =>
      emptyLabel !== undefined
        ? ["", ...items.map((item) => item.value)]
        : items.map((item) => item.value),
    [items, emptyLabel]
  )

  return (
    <ComboboxPrimitive.Root
      items={values}
      value={value}
      disabled={disabled}
      itemToStringLabel={(item) => labelByValue.get(item) ?? ""}
      onValueChange={(next) => onValueChange(next ?? null)}
    >
      <ComboboxPrimitive.InputGroup
        data-slot="combobox-input-group"
        className={cn(
          "flex h-8 w-full items-center gap-1 rounded-lg border border-input bg-transparent pr-1.5 pl-2.5 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-50 dark:bg-input/30",
          className
        )}
      >
        <ComboboxPrimitive.Input
          id={id}
          data-slot="combobox-input"
          placeholder={placeholder}
          className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {emptyLabel !== undefined && value !== "" ? (
          <ComboboxPrimitive.Clear
            data-slot="combobox-clear"
            aria-label="Kosongkan"
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </ComboboxPrimitive.Clear>
        ) : null}
        <ComboboxPrimitive.Trigger
          data-slot="combobox-trigger"
          aria-label="Buka daftar"
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground outline-none"
        >
          <ChevronDownIcon className="size-4" />
        </ComboboxPrimitive.Trigger>
      </ComboboxPrimitive.InputGroup>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="isolate z-50">
          <ComboboxPrimitive.Popup
            data-slot="combobox-popup"
            className={cn(
              "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <ComboboxPrimitive.Empty
              data-slot="combobox-empty"
              className="px-1.5 py-1 text-sm text-muted-foreground"
            >
              {emptyText}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="scroll-my-1">
              {(item: string) => (
                <ComboboxPrimitive.Item
                  key={item}
                  value={item}
                  data-slot="combobox-item"
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {labelByValue.get(item) ?? item}
                  <ComboboxPrimitive.ItemIndicator
                    render={
                      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
                    }
                  >
                    <CheckIcon className="pointer-events-none size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}
