import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OdcPageError, OdcPagePending } from './odc-page-state'

describe('session-isolation R10: protected route loading and error states', () => {
  it('exposes an accessible pending state while session or data resolves', () => {
    render(<OdcPagePending />)

    expect(screen.getByRole('main').getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText(/cargando información/i)).not.toBeNull()
    expect(
      screen.getByTestId('page-loading-indicator').getAttribute('class'),
    ).toContain('motion-reduce:animate-none')
  })

  it('shows a non-interactive error without a retry button', () => {
    render(<OdcPageError />)

    expect(screen.getByRole('alert')).not.toBeNull()
    expect(
      screen.queryByRole('button', { name: /reintentar/i }),
    ).toBeNull()
  })
})
