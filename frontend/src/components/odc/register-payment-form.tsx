import { useRef, useState } from 'react'
import { BanknoteIcon } from 'lucide-react'
import type { RegisterPaymentPayload } from '@/lib/api'
import type { SessionUser } from '@/lib/session'
import type { Odc } from '@/lib/odc'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from '@/components/ui/toast'

export function RegisterPaymentForm({
  odc,
  role,
  register,
  onSuccess,
}: {
  odc: Odc
  role: SessionUser['role']
  register: (payload: RegisterPaymentPayload) => Promise<Odc>
  onSuccess: (odc: Odc) => void
}) {
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    paymentDate?: string
    paymentMethod?: string
  }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const paymentDateRef = useRef<HTMLInputElement>(null)
  const paymentMethodRef = useRef<HTMLInputElement>(null)

  if (role !== 'DIRECTOR_OPS' || odc.status !== 'COMPRA_APROBADA') {
    return null
  }

  function validatePaymentDate() {
    const message = paymentDate ? undefined : 'La fecha de pago es obligatoria.'
    setFieldErrors((current) => ({ ...current, paymentDate: message }))
    return message
  }

  function validatePaymentMethod() {
    const message = paymentMethod.trim()
      ? undefined
      : 'El método de pago es obligatorio.'
    setFieldErrors((current) => ({ ...current, paymentMethod: message }))
    return message
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const paymentDateError = paymentDate
      ? undefined
      : 'La fecha de pago es obligatoria.'
    const trimmedMethod = paymentMethod.trim()
    const paymentMethodError = trimmedMethod
      ? undefined
      : 'El método de pago es obligatorio.'
    setFieldErrors({
      paymentDate: paymentDateError,
      paymentMethod: paymentMethodError,
    })
    if (paymentDateError || paymentMethodError) {
      ;(paymentDateError ? paymentDateRef : paymentMethodRef).current?.focus()
      return
    }

    setSubmitting(true)
    setApiError(null)
    try {
      const trimmedReference = paymentReference.trim()
      const trimmedNotes = paymentNotes.trim()
      const nextOdc = await register({
        paymentDate,
        paymentMethod: trimmedMethod,
        ...(trimmedReference ? { paymentReference: trimmedReference } : {}),
        ...(trimmedNotes ? { paymentNotes: trimmedNotes } : {}),
      })
      toast.add({
        type: 'success',
        title: 'Pago registrado',
        description: 'Administración ya puede adjuntar el comprobante.',
      })
      onSuccess(nextOdc)
    } catch {
      setApiError('No pudimos registrar el pago. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-8" aria-labelledby="register-payment-title">
      <Card>
        <CardHeader>
          <CardTitle id="register-payment-title">Registrar pago</CardTitle>
          <CardDescription>
            Registra los datos del pago realizado a la orden.
          </CardDescription>
        </CardHeader>
        <form
          className="contents"
          onSubmit={handleSubmit}
          aria-busy={submitting}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-date">Fecha de pago</Label>
              <DatePicker
                id="payment-date"
                label="Fecha de pago"
                value={paymentDate}
                onChange={(value) => {
                  setPaymentDate(value)
                  setFieldErrors((current) => ({
                    ...current,
                    paymentDate: undefined,
                  }))
                  setApiError(null)
                }}
                onBlur={validatePaymentDate}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.paymentDate)}
                aria-describedby={
                  fieldErrors.paymentDate ? 'payment-date-error' : undefined
                }
                inputRef={paymentDateRef}
              />
              {fieldErrors.paymentDate ? (
                <p
                  id="payment-date-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.paymentDate}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de pago</Label>
              <Input
                ref={paymentMethodRef}
                id="payment-method"
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value)
                  setFieldErrors((current) => ({
                    ...current,
                    paymentMethod: undefined,
                  }))
                  setApiError(null)
                }}
                onBlur={validatePaymentMethod}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.paymentMethod)}
                aria-describedby={
                  fieldErrors.paymentMethod ? 'payment-method-error' : undefined
                }
              />
              {fieldErrors.paymentMethod ? (
                <p
                  id="payment-method-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.paymentMethod}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-reference">Referencia</Label>
              <Input
                id="payment-reference"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                disabled={submitting}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notas</Label>
              <Textarea
                id="payment-notes"
                value={paymentNotes}
                onChange={(event) => setPaymentNotes(event.target.value)}
                disabled={submitting}
                placeholder="Opcional"
              />
            </div>
            {apiError ? (
              <p role="alert" className="text-sm text-destructive">
                {apiError}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="border-t flex flex-col items-stretch sm:flex-row sm:items-center">
            <Button type="submit" variant="confirm" disabled={submitting}>
              <BanknoteIcon aria-hidden="true" />
              {submitting ? 'Registrando…' : 'Registrar pago'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </section>
  )
}
