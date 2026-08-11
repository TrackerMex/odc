import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusLabel } from '@/lib/odc'
import type { OdcStatus } from '@/lib/odc'

// La inversión por tema vive en los tokens declarados en `.dark`
// (feature 23, R4). Repetirla aquí con una variante por tema partiría la
// fuente de verdad del color de estado en dos.
const statusStyles: Record<OdcStatus, string> = {
  BORRADOR: 'bg-status-draft-surface text-status-draft',
  PENDIENTE_ADMIN: 'bg-status-pending-surface text-status-pending',
  PRESUPUESTO_APROBADO: 'bg-status-budget-surface text-status-budget',
  COMPRA_APROBADA: 'bg-status-approved-surface text-status-approved',
  PAGO_REGISTRADO: 'bg-status-paid-surface text-status-paid',
  EVIDENCIA_PAGO_SUBIDA: 'bg-status-evidence-surface text-status-evidence',
  COMPLETADA: 'bg-status-done-surface text-status-done',
  RECHAZADA: 'bg-status-rejected-surface text-status-rejected',
}

export function OdcStatusBadge({
  status,
  className,
}: {
  status: OdcStatus
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      data-status={status}
      className={cn(
        'border-0 font-medium transition-[background-color,color] duration-150 ease-out motion-reduce:transition-none',
        statusStyles[status],
        className,
      )}
    >
      {statusLabel(status)}
    </Badge>
  )
}
