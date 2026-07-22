import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'
import { resolveSession } from '@/lib/session'

export async function loginBeforeLoad() {
  const user = await resolveSession()
  if (user) {
    throw redirect({ to: '/' })
  }
}

export const Route = createFileRoute('/login')({
  beforeLoad: loginBeforeLoad,
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
