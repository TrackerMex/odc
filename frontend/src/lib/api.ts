import type { SessionUser } from './session'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message =
      (body as { message?: string } | null)?.message ?? response.statusText
    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
}

export function getMe(): Promise<SessionUser> {
  return apiFetch<SessionUser>('/api/auth/me')
}

export function login(credentials: {
  email: string
  password: string
}): Promise<{ user: SessionUser }> {
  return apiFetch<{ user: SessionUser }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function logout(): Promise<{ success: true }> {
  return apiFetch<{ success: true }>('/api/auth/logout', { method: 'POST' })
}
