import { useEffect, useState, type ReactNode } from "react"

import {
  ThemeContext,
  type Theme,
  type ThemeProviderState,
} from "./theme-context"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const applyThemeClass = (value: Theme) => {
    if (typeof document === "undefined") {
      return
    }

    const root = document.documentElement
    const resolvedTheme = value === "system" ? getSystemTheme() : value
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
  }

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme
    }

    const storedTheme = window.localStorage.getItem(storageKey) as Theme | null
    if (storedTheme) {
      applyThemeClass(storedTheme)
      return storedTheme
    }

    applyThemeClass(defaultTheme)
    return defaultTheme
  })

  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applySystemPreference = (isDark: boolean) => {
      if (typeof document === "undefined") {
        return
      }

      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(isDark ? "dark" : "light")
    }

    applySystemPreference(mediaQuery.matches)

    const listener = (event: MediaQueryListEvent) => {
      applySystemPreference(event.matches)
    }

    mediaQuery.addEventListener("change", listener)

    return () => {
      mediaQuery.removeEventListener("change", listener)
    }
  }, [theme])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    applyThemeClass(nextTheme)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, nextTheme)
    }
  }

  const value: ThemeProviderState = { theme, setTheme }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function getSystemTheme(): Exclude<Theme, "system"> {
  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export { ThemeProvider }
