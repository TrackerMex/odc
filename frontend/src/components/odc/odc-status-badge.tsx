import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusLabel } from '@/lib/odc'
import type { OdcStatus } from '@/lib/odc'

// La inversión por tema vive en los tokens declarados en `.dark`
// (feature 23, R4). Repetirla aquí con una variante por tema partiría la
// fuente de verdad del color de estado en dos.
export const statusStyles: Record<OdcStatus, { badge: string; point: string }> =
  {
    BORRADOR: {
      badge: 'bg-status-draft-surface text-status-draft',
      point: 'border-status-draft bg-status-draft',
    },
    PENDIENTE_ADMIN: {
      badge: 'bg-status-pending-surface text-status-pending',
      point: 'border-status-pending bg-status-pending',
    },
    PRESUPUESTO_APROBADO: {
      badge: 'bg-status-budget-surface text-status-budget',
      point: 'border-status-budget bg-status-budget',
    },
    COMPRA_APROBADA: {
      badge: 'bg-status-approved-surface text-status-approved',
      point: 'border-status-approved bg-status-approved',
    },
    PAGO_REGISTRADO: {
      badge: 'bg-status-paid-surface text-status-paid',
      point: 'border-status-paid bg-status-paid',
    },
    EVIDENCIA_PAGO_SUBIDA: {
      badge: 'bg-status-evidence-surface text-status-evidence',
      point: 'border-status-evidence bg-status-evidence',
    },
    COMPLETADA: {
      badge: 'bg-status-done-surface text-status-done',
      point: 'border-status-done bg-status-done',
    },
    RECHAZADA: {
      badge: 'bg-status-rejected-surface text-status-rejected',
      point: 'border-status-rejected bg-status-rejected',
    },
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
        statusStyles[status].badge,
        className,
      )}
    >
      {statusLabel(status)}
    </Badge>
  )
}
