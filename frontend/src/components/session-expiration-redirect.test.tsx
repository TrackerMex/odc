import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type * as RouterModule from '@tanstack/react-router'
import { expireClientSession } from '@/lib/session-expiration'
import { SessionExpirationRedirect } from './session-expiration-redirect'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return { ...actual, useNavigate: () => navigateMock }
})

describe('session-isolation R9: global expired-session redirect', () => {
  it('navigates to login when the API reports an expired session', () => {
    render(<SessionExpirationRedirect />)

    expireClientSession()

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/login',
      replace: true,
      reloadDocument: true,
    })
  })
})
