import { useState } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
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
import { toast } from '@/components/ui/toast'

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
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(
    null,
  )

  if (role !== 'ADMINISTRACION' || odc.status !== 'PENDIENTE_ADMIN') {
    return null
  }

  async function handleApprove() {
    if (submitting) return
    setSubmitting('approve')
    setApproveError(null)
    try {
      const nextOdc = await approve()
      toast.add({
        type: 'success',
        title: 'Presupuesto aprobado',
        description: 'La orden pasó a aprobación de compra.',
      })
      onSuccess(nextOdc)
    } catch {
      setApproveError(
        'No pudimos aprobar el presupuesto. Intenta nuevamente.',
      )
    } finally {
      setSubmitting(null)
    }
  }

  async function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setReasonError('El motivo del rechazo es obligatorio.')
      setRejectError(null)
      return
    }
    setSubmitting('reject')
    setReasonError(null)
    setRejectError(null)
    try {
      const nextOdc = await reject(trimmedReason)
      toast.add({
        type: 'success',
        title: 'Presupuesto rechazado',
        description: 'La orden volvió con observaciones al solicitante.',
      })
      onSuccess(nextOdc)
      setDialogOpen(false)
      setReason('')
    } catch {
      setRejectError(
        'No pudimos rechazar el presupuesto. Intenta nuevamente.',
      )
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
          {approveError ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {approveError}
            </p>
          ) : null}
        </CardContent>
        <CardFooter
          className="border-t flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
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
              setApproveError(null)
              setReasonError(null)
              setRejectError(null)
              setDialogOpen(true)
            }}
            disabled={submitting !== null}
          >
            <XIcon aria-hidden="true" />
            Rechazar
          </Button>
        </CardFooter>
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
                onChange={(event) => {
                  setReason(event.target.value)
                  setReasonError(null)
                }}
                disabled={submitting !== null}
                aria-invalid={Boolean(reasonError)}
                aria-describedby={
                  reasonError ? 'rejection-reason-error' : undefined
                }
              />
              {reasonError ? (
                <p
                  id="rejection-reason-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {reasonError}
                </p>
              ) : null}
              {rejectError ? (
                <p role="alert" className="text-sm text-destructive">
                  {rejectError}
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
