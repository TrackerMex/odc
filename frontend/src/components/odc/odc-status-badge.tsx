import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusLabel } from '@/lib/odc'
import type { OdcStatus } from '@/lib/odc'

const statusStyles: Record<OdcStatus, string> = {
  BORRADOR: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  PENDIENTE_ADMIN:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  PRESUPUESTO_APROBADO:
    'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  COMPRA_APROBADA:
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  PAGO_REGISTRADO:
    'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  EVIDENCIA_PAGO_SUBIDA:
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
  COMPLETADA:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  RECHAZADA: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
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
      className={cn('border-0 font-medium', statusStyles[status], className)}
    >
      {statusLabel(status)}
    </Badge>
  )
}
