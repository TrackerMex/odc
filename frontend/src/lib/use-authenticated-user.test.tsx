import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type * as RouterModule from '@tanstack/react-router'
import { useAuthenticatedUser } from './use-authenticated-user'

const { getRouteApiMock, useRouteContextMock } = vi.hoisted(() => ({
  getRouteApiMock: vi.fn(),
  useRouteContextMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  getRouteApiMock.mockReturnValue({
    useRouteContext: useRouteContextMock,
  })
  return { ...actual, getRouteApi: getRouteApiMock }
})

describe('session-isolation R7: protected children use the parent auth context', () => {
  it.each([
    ['DIRECTOR_OPS', 'Operaciones'],
    ['ADMINISTRACION', 'Administración'],
    ['DIRECTOR_GENERAL', 'Dirección General'],
  ])('returns the %s user from /_authenticated', (role, fullName) => {
    const user = {
      id: role,
      email: `${role.toLowerCase()}@example.com`,
      fullName,
      role,
    }
    useRouteContextMock.mockReturnValue({ user })

    const { result } = renderHook(() => useAuthenticatedUser())

    expect(getRouteApiMock).toHaveBeenCalledWith('/_authenticated')
    expect(result.current).toEqual(user)
  })
})
