import { createIsomorphicFn } from '@tanstack/react-start'
import type { SessionUser } from './session'
import type {
  Odc,
  OdcPage,
  OdcPayload,
  OdcStatus,
  Supplier,
} from './odc'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Matches the dev proxy target in vite.config.ts. Overridable via
// API_BASE_URL for Docker, where the backend is reachable as
// http://backend:3001 (docker-compose service name), not localhost.
const DEFAULT_SERVER_API_BASE_URL = 'http://localhost:3001'

export function isServer(): boolean {
  return typeof window === 'undefined'
}

// Node's fetch (used during SSR beforeLoad/loaders) requires an absolute
// URL, unlike the browser's fetch, which resolves relative paths against
// the current origin. Only the server needs the full URL; the browser keeps
// using the relative path through the dev/prod proxy (unchanged, R1).
function resolveUrl(path: string): string {
  if (!isServer()) return path
  const base = process.env.API_BASE_URL ?? DEFAULT_SERVER_API_BASE_URL
  return `${base}${path}`
}

// Node's fetch also doesn't forward the browser's cookies the way the
// browser's own fetch does, so SSR requests would otherwise always look
// unauthenticated. Forward the incoming request's Cookie header when one is
// available; the client implementation is a no-op (the browser handles its
// own cookies).
//
// `@tanstack/react-start/server` is server-only (importing it directly from
// isomorphic code is rejected by the build's import-protection plugin, and
// broke the dev SSR module runner too — verified against the real dev
// server in Docker). createIsomorphicFn() is the framework-provided escape
// hatch for exactly this: its compiler splits the .server()/.client() pair
// per bundle, so the server-only import here never reaches the client.
const getIncomingCookieHeader = createIsomorphicFn()
  .server(async (): Promise<string | undefined> => {
    try {
      const { getRequestHeaders } = await import('@tanstack/react-start/server')
      return getRequestHeaders().get('cookie') ?? undefined
    } catch {
      return undefined
    }
  })
  .client(async (): Promise<string | undefined> => undefined)

async function resolveHeaders(
  init?: RequestInit,
): Promise<HeadersInit | undefined> {
  const cookie = await getIncomingCookieHeader()
  if (!cookie) return init?.headers

  const headers = new Headers(init?.headers)
  headers.set('cookie', cookie)
  return headers
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(resolveUrl(path), {
    ...init,
    headers: await resolveHeaders(init),
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

function jsonRequest(method: 'POST' | 'PATCH', body?: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }
}

export function listOdcs(status: OdcStatus, page = 1): Promise<OdcPage> {
  const query = new URLSearchParams({ status, page: String(page) })
  return apiFetch<OdcPage>(`/api/odcs?${query.toString()}`)
}

export function getOdc(id: string): Promise<Odc> {
  return apiFetch<Odc>(`/api/odcs/${encodeURIComponent(id)}`)
}

export function listSuppliers(): Promise<Supplier[]> {
  return apiFetch<Supplier[]>('/api/suppliers')
}

export function createOdc(payload: OdcPayload): Promise<Odc> {
  return apiFetch<Odc>('/api/odcs', jsonRequest('POST', payload))
}

export function updateOdc(id: string, payload: OdcPayload): Promise<Odc> {
  return apiFetch<Odc>(
    `/api/odcs/${encodeURIComponent(id)}`,
    jsonRequest('PATCH', payload),
  )
}

export function submitOdc(id: string): Promise<Odc> {
  return apiFetch<Odc>(
    `/api/odcs/${encodeURIComponent(id)}/submit`,
    jsonRequest('POST'),
  )
}
