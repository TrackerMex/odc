import { useState } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function AdminBudgetActions({
  odc,
  role,
  approve,
  reject,
  onSuccess,
}: {
  odc: Odc
  role: SessionUser['role']
  approve: () => Promise<Odc>
  reject: (reason: string) => Promise<Odc>
  onSuccess: (odc: Odc) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(
    null,
  )

  if (role !== 'ADMINISTRACION' || odc.status !== 'PENDIENTE_ADMIN') {
    return null
  }

  async function handleApprove() {
    if (submitting) return
    setSubmitting('approve')
    setError(null)
    try {
      onSuccess(await approve())
    } catch {
      setError('No pudimos aprobar el presupuesto. Intenta nuevamente.')
    } finally {
      setSubmitting(null)
    }
  }

  async function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setError('El motivo del rechazo es obligatorio.')
      return
    }
    setSubmitting('reject')
    setError(null)
    try {
      onSuccess(await reject(trimmedReason))
      setDialogOpen(false)
      setReason('')
    } catch {
      setError('No pudimos rechazar el presupuesto. Intenta nuevamente.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <section className="mt-8" aria-labelledby="budget-actions-title">
      <Card>
        <CardHeader>
          <CardTitle id="budget-actions-title">Validar presupuesto</CardTitle>
          <CardDescription>
            Confirma si la orden puede continuar a aprobación de compra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !dialogOpen ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div
            className="flex flex-col gap-3 sm:flex-row"
            aria-busy={submitting !== null}
          >
            <Button
              type="button"
              onClick={handleApprove}
              disabled={submitting !== null}
            >
              <CheckIcon aria-hidden="true" />
              {submitting === 'approve' ? 'Aprobando…' : 'Aprobar presupuesto'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setError(null)
                setDialogOpen(true)
              }}
              disabled={submitting !== null}
            >
              <XIcon aria-hidden="true" />
              Rechazar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDialogOpen(open)
        }}
      >
        <DialogContent>
          <form onSubmit={handleReject}>
            <DialogHeader>
              <DialogTitle>Rechazar presupuesto</DialogTitle>
              <DialogDescription>
                Explica qué debe corregir el Director de Operaciones.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-2">
              <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
              <Textarea
                id="rejection-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={submitting !== null}
                aria-invalid={Boolean(error)}
              />
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting !== null}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={submitting !== null}
              >
                {submitting === 'reject' ? 'Rechazando…' : 'Confirmar rechazo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
