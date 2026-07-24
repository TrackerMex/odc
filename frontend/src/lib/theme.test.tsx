import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import {
  applyTheme,
  getInitialTheme,
  THEME_STORAGE_KEY,
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
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
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
