"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { StickyHeader } from "@/components/sticky-header"
import { StoreState } from "@/components/store-state"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { UserDialog } from "@/components/pengaturan/dialogs/user-dialog"
import { ItemActions } from "@/components/pengaturan/item-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  hasActiveFilters,
  type FilterField,
  type FilterValues,
} from "@/lib/filters"
import { formatDate } from "@/lib/format"
import type { AppUser, UserInput } from "@/lib/types"
import { ROLE_LABEL, filterUsers } from "@/lib/users"

const FIELDS: FilterField[] = [
  {
    type: "search",
    name: "q",
    label: "Search",
    placeholder: "Name or username",
  },
  {
    type: "select",
    name: "role",
    label: "Role",
    allLabel: "All roles",
    options: [
      { label: ROLE_LABEL.admin, value: "admin" },
      { label: ROLE_LABEL.guest, value: "guest" },
    ],
  },
]

export function UserView({ values }: { values: FilterValues }) {
  const [users, setUsers] = React.useState<AppUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [dialog, setDialog] = React.useState<{
    open: boolean
    item: AppUser | null
  }>({ open: false, item: null })
  const [pendingDelete, setPendingDelete] = React.useState<AppUser | null>(null)

  const reload = () => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  React.useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const response = await fetch("/api/users")
        const data = await response.json().catch(() => null)
        if (cancelled) return
        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to load users.")
        }
        setUsers(data as AppUser[])
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load users.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const filtered = React.useMemo(
    () => filterUsers(users, values),
    [users, values]
  )

  const submit = async (input: UserInput) => {
    const editing = dialog.item

    try {
      const response = await fetch(
        editing ? `/api/users/${editing.id}` : "/api/users",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }
      )
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? "Save failed.")
      }
    } catch (err) {
      return err instanceof Error ? err.message : "Save failed."
    }

    reload()
    return null
  }

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="User"
          description="Accounts that can sign in. Administrator manages everything; Guest is read-only."
          actions={
            <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
              <Plus />
              Add User
            </Button>
          }
        />
        <FilterBar fields={FIELDS} values={values} />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <StoreState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={false}
        >
          <div className="contents">
            <Card size="sm" className="py-0">
              <CardContent className="px-0">
                {filtered.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {hasActiveFilters(values)
                      ? "No results found. Change keywords or reset filters."
                      : "No users yet."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="pr-4 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="pl-4 font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {user.username}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === "admin" ? "default" : "secondary"
                              }
                            >
                              {ROLE_LABEL[user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="pr-4">
                            <ItemActions
                              label={user.name}
                              onEdit={() =>
                                setDialog({ open: true, item: user })
                              }
                              onDelete={() => setPendingDelete(user)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </StoreState>
      </div>

      <UserDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((previous) => ({ ...previous, open }))
        }
        user={dialog.item}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete ${pendingDelete?.name}?`}
        description={`Account "${pendingDelete?.username}" will no longer be able to sign in. This action cannot be undone.`}
        onConfirm={async () => {
          if (!pendingDelete) return
          try {
            const response = await fetch(`/api/users/${pendingDelete.id}`, {
              method: "DELETE",
            })
            const data = await response.json().catch(() => null)
            if (!response.ok) {
              throw new Error(data?.error ?? "Delete failed.")
            }
          } catch (error) {
            return error instanceof Error ? error.message : "Delete failed."
          }
          setPendingDelete(null)
          reload()
        }}
      />
    </div>
  )
}
