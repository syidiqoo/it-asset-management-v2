"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import FormControl from "@mui/material/FormControl"
import FormLabel from "@mui/material/FormLabel"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import OutlinedInput from "@mui/material/OutlinedInput"

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error ?? "Invalid username or password.")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Could not reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormControl fullWidth>
              <FormLabel htmlFor="login-username" className="mb-1.5">
                Username
              </FormLabel>
              <OutlinedInput
                id="login-username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (error) setError(null)
                }}
                className="h-11 rounded-xl"
                autoComplete="username"
                autoFocus
                required
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel htmlFor="login-password" className="mb-1.5">
                Password
              </FormLabel>
              <OutlinedInput
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (error) setError(null)
                }}
                className="h-11 rounded-xl"
                autoComplete="current-password"
                required
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      edge="end"
                      size="small"
                      onClick={() => setShowPassword((previous) => !previous)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Button
              type="submit"
              variant="contained"
              className="h-11 w-full gap-1.5 rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/cocpit.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  )
}
