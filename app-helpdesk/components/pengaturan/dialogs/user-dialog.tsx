"use client"

import * as React from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLES, type AppUser, type Role, type UserInput } from "@/lib/types"
import { ROLE_LABEL } from "@/lib/users"

const ROLE_OPTIONS = ROLES.map((role) => ({
  label: ROLE_LABEL[role],
  value: role,
}))

type UserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AppUser | null
  onSubmit: (input: UserInput) => string | null | Promise<string | null>
}

export function UserDialog({ open, onOpenChange, ...props }: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <UserDialogForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function UserDialogForm({
  user,
  onSubmit,
  onDone,
}: Omit<UserDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void
}) {
  const [name, setName] = React.useState(user?.name ?? "")
  const [username, setUsername] = React.useState(user?.username ?? "")
  const [role, setRole] = React.useState<Role>(user?.role ?? "guest")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedUsername = username.trim()

    if (!trimmedName) {
      setError("Name is required.")
      return
    }
    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters.")
      return
    }
    if (!user && password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password && password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    const message = await onSubmit({
      name: trimmedName,
      username: trimmedUsername,
      role,
      password: password ? password : undefined,
    })

    if (message) {
      setError(message)
      return
    }

    onDone()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
        <DialogDescription>
          Administrator can manage everything. Guest can only view Dashboard,
          Asset Data, SIM Card, and Internet Data.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="user-name">Name</Label>
          <Input
            id="user-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Budi Santoso"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-username">Username</Label>
          <Input
            id="user-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="off"
            placeholder="budi"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select
            items={ROLE_OPTIONS}
            value={role}
            onValueChange={(value) => setRole(value === "admin" ? "admin" : "guest")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((item) => (
                <SelectItem key={item} value={item}>
                  {ROLE_LABEL[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-password">Password</Label>
          <Input
            id="user-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder={user ? "Leave blank to keep current" : "Min. 8 characters"}
          />
          <p className="text-xs text-muted-foreground">
            {user
              ? "Leave blank to keep the current password."
              : "Minimum 8 characters."}
          </p>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter className="-mx-4">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit">
            <Save />
            Save
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
