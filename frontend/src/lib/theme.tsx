import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'odc-theme'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'dark' || storedTheme === 'light'
    ? storedTheme
    : getSystemTheme()
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function ThemeToggle() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('ThemeToggle must be used inside ThemeProvider')

  const isDark = context.theme === 'dark'
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  return (
    <Button
      aria-label={label}
      title={label}
      variant="ghost"
      size="icon"
      onClick={context.toggleTheme}
    >
      {isDark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  )
}

export { THEME_STORAGE_KEY }
