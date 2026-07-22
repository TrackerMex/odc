import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { cn } from '@/lib/utils'
import { ApiError, login } from '@/lib/api'
import { loginSchema } from '@/lib/login-schema'
import { useSessionStore } from '@/stores/session.store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface FieldErrors {
  email?: string
  password?: string
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const navigate = useNavigate()
  const setUser = useSessionStore((state) => state.setUser)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      })
      setFormError(null)
      return
    }

    setFieldErrors({})
    setFormError(null)

    try {
      const { user } = await login(result.data)
      setUser(user)
      navigate({ to: '/' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Correo o contraseña incorrectos.')
        return
      }
      throw error
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Ingresa a tu cuenta</CardTitle>
          <CardDescription>
            Ingresa tu correo y contraseña para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="login-form" onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field
                data-testid="email-field"
                data-invalid={!!fieldErrors.email}
              >
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={!!fieldErrors.email}
                />
                <FieldError
                  errors={
                    fieldErrors.email ? [{ message: fieldErrors.email }] : []
                  }
                />
              </Field>
              <Field
                data-testid="password-field"
                data-invalid={!!fieldErrors.password}
              >
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={!!fieldErrors.password}
                />
                <FieldError
                  errors={
                    fieldErrors.password
                      ? [{ message: fieldErrors.password }]
                      : []
                  }
                />
              </Field>
              {formError ? (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              ) : null}
              <Field>
                <Button type="submit">Ingresar</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
