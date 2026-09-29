"use client"

import * as React from "react"
import { ThemeProvider } from "@mui/material/styles"

import { theme } from "@/lib/theme"

export function MuiProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
