import { getRouteApi } from '@tanstack/react-router'
import type { SessionUser } from './session'

const authenticatedRouteApi = getRouteApi('/_authenticated')

export function useAuthenticatedUser(): SessionUser {
  return authenticatedRouteApi.useRouteContext().user
}
