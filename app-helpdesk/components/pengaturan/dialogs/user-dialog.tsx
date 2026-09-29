"use client"

import * as React from "react"
import { Save } from "lucide-react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"

import { ROLES, type AppUser, type Role, type UserInput } from "@/lib/types"
import { ROLE_LABEL } from "@/lib/users"

type UserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AppUser | null
  onSubmit: (input: UserInput) => string | null | Promise<string | null>
}

export function UserDialog({ open, onOpenChange, ...props }: UserDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      {open ? (
        <UserDialogForm {...props} onDone={() => onOpenChange(false)} />
      ) : null}
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
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
      <DialogContent className="space-y-4">
        <DialogContentText>
          Administrator can manage everything. Guest can only view Dashboard,
          Asset Data, SIM Card, and Internet Data.
        </DialogContentText>

        <TextField
          id="user-name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Budi Santoso"
          fullWidth
          size="small"
          autoFocus
        />

        <TextField
          id="user-username"
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="off"
          placeholder="budi"
          fullWidth
          size="small"
        />

        <TextField
          select
          label="Role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value === "admin" ? "admin" : "guest")
          }
          fullWidth
          size="small"
        >
          {ROLES.map((item) => (
            <MenuItem key={item} value={item}>
              {ROLE_LABEL[item]}
            </MenuItem>
          ))}
        </TextField>

        <div>
          <TextField
            id="user-password"
            type="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder={
              user ? "Leave blank to keep current" : "Min. 8 characters"
            }
            fullWidth
            size="small"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {user
              ? "Leave blank to keep the current password."
              : "Minimum 8 characters."}
          </p>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={<Save className="size-4" />}
        >
          Save
        </Button>
      </DialogActions>
    </form>
  )
}
