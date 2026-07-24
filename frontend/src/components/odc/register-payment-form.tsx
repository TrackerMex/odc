import { useState } from 'react'
import { BanknoteIcon } from 'lucide-react'
import type { RegisterPaymentPayload } from '@/lib/api'
import type { SessionUser } from '@/lib/session'
import type { Odc } from '@/lib/odc'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (role !== 'DIRECTOR_OPS' || odc.status !== 'COMPRA_APROBADA') {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (!paymentDate) {
      setError('La fecha de pago es obligatoria.')
      return
    }
    const trimmedMethod = paymentMethod.trim()
    if (!trimmedMethod) {
      setError('El método de pago es obligatorio.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const trimmedReference = paymentReference.trim()
      const trimmedNotes = paymentNotes.trim()
      onSuccess(
        await register({
          paymentDate,
          paymentMethod: trimmedMethod,
          ...(trimmedReference ? { paymentReference: trimmedReference } : {}),
          ...(trimmedNotes ? { paymentNotes: trimmedNotes } : {}),
        }),
      )
    } catch {
      setError('No pudimos registrar el pago. Intenta nuevamente.')
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
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-busy={submitting}
          >
            <div className="space-y-2">
              <Label htmlFor="payment-date">Fecha de pago</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de pago</Label>
              <Input
                id="payment-method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                disabled={submitting}
              />
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
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              <BanknoteIcon aria-hidden="true" />
              {submitting ? 'Registrando…' : 'Registrar pago'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
