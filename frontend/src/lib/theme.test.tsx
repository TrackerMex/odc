import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import {
  applyTheme,
  getInitialTheme,
  THEME_STORAGE_KEY,
  themeInitScript,
  ThemeProvider,
  ThemeToggle,
} from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
  window.matchMedia = vi.fn(() => ({ matches: false }) as MediaQueryList)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
})

describe('R14: tema persistido sin diferencias de hidratación', () => {
  it('hydrates server markup without replacing dark mode or its saved preference', async () => {
    const content = <ThemeProvider><ThemeToggle /></ThemeProvider>
    vi.stubGlobal('window', undefined)
    let markup: string
    try {
      markup = renderToString(content)
    } finally {
      vi.unstubAllGlobals()
    }
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    new Function(themeInitScript)()
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.appendChild(container)
    const onRecoverableError = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const toggleClass = vi.spyOn(document.documentElement.classList, 'toggle')
    const savePreference = vi.spyOn(Storage.prototype, 'setItem')
    let root: ReturnType<typeof hydrateRoot> | undefined
    try {
      await act(async () => {
        root = hydrateRoot(container, content, { onRecoverableError })
      })
      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(consoleError).not.toHaveBeenCalled()
      expect(toggleClass).not.toHaveBeenCalledWith('dark', false)
      expect(savePreference).not.toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
      expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Cambiar a modo claro')
    } finally {
      await act(async () => root?.unmount())
      container.remove()
    }
  })

  it('keeps system dark mode and the toggle usable when storage is unavailable', () => {
    window.matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable') })

    new Function(themeInitScript)()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    renderThemeToggle()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

function renderThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('R1: activar y persistir el tema oscuro', () => {
  it('applies dark mode and saves the selection when the control is activated', () => {
    renderThemeToggle()

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
})

describe('R2: restaurar preferencia guardada o del sistema', () => {
  it('applies the stored theme synchronously before React hydrates', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    new Function(themeInitScript)()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('restores the saved preference before checking the system preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(getInitialTheme()).toBe('dark')
  })

  it('uses the system preference when no saved preference exists', () => {
    window.matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList)
    expect(getInitialTheme()).toBe('dark')
  })
})

describe('R3: control accesible de tema', () => {
  it('identifies the action in Spanish and exposes the current state through the action label', () => {
    renderThemeToggle()

    const toggle = screen.getByRole('button', { name: 'Cambiar a modo oscuro' })
    expect(toggle.getAttribute('title')).toBe('Cambiar a modo oscuro')

    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeTruthy()
  })
})

describe('R4: actualizar color scheme sin recarga', () => {
  it('updates the document class and color scheme immediately', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
