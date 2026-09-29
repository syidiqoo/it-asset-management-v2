import { createTheme } from "@mui/material/styles"

export const theme = createTheme({
  cssVariables: true,
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
  palette: {
    mode: "light",
    primary: { main: "#2563eb", contrastText: "#fafafa" },
    secondary: { main: "#f5f5f5", contrastText: "#404040" },
    error: { main: "#dc2626" },
    background: { default: "#ffffff", paper: "#ffffff" },
    divider: "#e5e5e5",
    text: { primary: "#262626", secondary: "#737373" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
      },
    },
  },
})
