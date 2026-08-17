import { useRef, useState } from 'react'
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
  const [submitting, setSubmitting] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function validateField(field: keyof FieldErrors) {
    const result = loginSchema.safeParse({ email, password })
    const message = result.success
      ? undefined
      : result.error.flatten().fieldErrors[field]?.[0]
    setFieldErrors((current) => ({ ...current, [field]: message }))
    return message
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      })
      setFormError(null)
      ;(flattened.email?.[0] ? emailRef : passwordRef).current?.focus()
      return
    }

    setFieldErrors({})
    setFormError(null)
    setSubmitting(true)

    try {
      const { user } = await login(result.data)
      setUser(user)
      await navigate({ to: '/', replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Correo o contraseña incorrectos.')
        return
      }
      throw error
    } finally {
      setSubmitting(false)
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
          <form
            data-testid="login-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={submitting}
          >
            <FieldGroup>
              <Field
                data-testid="email-field"
                data-invalid={!!fieldErrors.email}
              >
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setFieldErrors((current) => ({
                      ...current,
                      email: undefined,
                    }))
                    setFormError(null)
                  }}
                  onBlur={() => validateField('email')}
                  disabled={submitting}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={
                    fieldErrors.email ? 'email-error' : undefined
                  }
                />
                <FieldError
                  id="email-error"
                  errors={
                    fieldErrors.email ? [{ message: fieldErrors.email }] : []
                  }
                />
              </Field>
              <Field
                data-testid="password-field"
                data-invalid={!!fieldErrors.password}
              >
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  ref={passwordRef}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                    }))
                    setFormError(null)
                  }}
                  onBlur={() => validateField('password')}
                  disabled={submitting}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={
                    fieldErrors.password ? 'password-error' : undefined
                  }
                />
                <FieldError
                  id="password-error"
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
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Ingresando…' : 'Ingresar'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
