import { useState } from 'react'
import { BadgeCheckIcon, CheckIcon, XIcon } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)
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
    setError(null)
    try {
      onSuccess(await approve())
    } catch {
      setError('No pudimos aprobar la compra. Intenta nuevamente.')
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
      setError('No pudimos rechazar la compra. Intenta nuevamente.')
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
          {error && !dialogOpen ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {validatedByAdministration ? (
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <BadgeCheckIcon className="size-4" aria-hidden="true" />
              Validado por Administración
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
              {submitting === 'approve' ? 'Aprobando…' : 'Aprobar compra'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting !== null}
              onClick={() => {
                setError(null)
                setDialogOpen(true)
              }}
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
                {submitting === 'reject'
                  ? 'Rechazando…'
                  : 'Confirmar rechazo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
