import { useState } from 'react'
import { BadgeCheckIcon, CheckIcon, XIcon } from 'lucide-react'
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

interface GeneralApprovalActionsProps {
  odc: Odc
  role: SessionUser['role']
  approve: () => Promise<Odc>
  reject: (reason: string) => Promise<Odc>
  onSuccess: (odc: Odc) => void
}

export function GeneralApprovalActions({
  odc,
  role,
  approve,
  reject,
  onSuccess,
}: GeneralApprovalActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(
    null,
  )

  if (role !== 'DIRECTOR_GENERAL' || odc.status !== 'PRESUPUESTO_APROBADO') {
    return null
  }

  const validatedByAdministration = odc.history.some(
    (entry) => entry.toStatus === 'PRESUPUESTO_APROBADO',
  )

  async function handleApprove() {
    if (submitting) return
    setSubmitting('approve')
    setApproveError(null)
    try {
      const nextOdc = await approve()
      toast.add({
        type: 'success',
        title: 'Compra aprobada',
        description: 'La orden está lista para registrar el pago.',
      })
      onSuccess(nextOdc)
    } catch {
      setApproveError('No pudimos aprobar la compra. Intenta nuevamente.')
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
        title: 'Compra rechazada',
        description: 'La orden volvió con observaciones al solicitante.',
      })
      onSuccess(nextOdc)
      setDialogOpen(false)
      setReason('')
    } catch {
      setRejectError('No pudimos rechazar la compra. Intenta nuevamente.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <section className="mt-8" aria-labelledby="general-actions-title">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle id="general-actions-title">Aprobar compra</CardTitle>
          <CardDescription>
            Confirma si la orden puede continuar al proceso de compra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approveError ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {approveError}
            </p>
          ) : null}
          {validatedByAdministration ? (
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-status-done">
              <BadgeCheckIcon className="size-4" aria-hidden="true" />
              Validado por Administración
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
            {submitting === 'approve' ? 'Aprobando…' : 'Aprobar compra'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting !== null}
            onClick={() => {
              setApproveError(null)
              setReasonError(null)
              setRejectError(null)
              setDialogOpen(true)
            }}
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
              <DialogTitle>Rechazar compra</DialogTitle>
              <DialogDescription>
                Explica por qué la orden no puede continuar.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-2">
              <Label htmlFor="general-rejection-reason">
                Motivo del rechazo
              </Label>
              <Textarea
                id="general-rejection-reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  setReasonError(null)
                }}
                disabled={submitting !== null}
                aria-invalid={Boolean(reasonError)}
                aria-describedby={
                  reasonError ? 'general-rejection-reason-error' : undefined
                }
              />
              {reasonError ? (
                <p
                  id="general-rejection-reason-error"
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
