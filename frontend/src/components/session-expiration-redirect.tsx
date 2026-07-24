import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { subscribeToSessionExpiration } from '@/lib/session-expiration'

export function SessionExpirationRedirect() {
  const navigate = useNavigate()

  useEffect(
    () =>
      subscribeToSessionExpiration(() => {
        void navigate({
          to: '/login',
          replace: true,
          reloadDocument: true,
        })
      }),
    [navigate],
  )

  return null
}
