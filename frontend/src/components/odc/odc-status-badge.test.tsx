import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { statusLabel } from '@/lib/odc'
import type { OdcStatus } from '@/lib/odc'
import { OdcStatusBadge } from './odc-status-badge'

// Tabla normativa de R1 (MASTER §1). El token de texto y el de superficie de
// cada estado; las utilidades salen de `@theme inline`, que ya expone los 16
// pares como `--color-status-*` (feature 23, R4).
const STATUS_TOKENS: Array<[OdcStatus, string]> = [
  ['BORRADOR', 'draft'],
  ['PENDIENTE_ADMIN', 'pending'],
  ['PRESUPUESTO_APROBADO', 'budget'],
  ['COMPRA_APROBADA', 'approved'],
  ['PAGO_REGISTRADO', 'paid'],
  ['EVIDENCIA_PAGO_SUBIDA', 'evidence'],
  ['COMPLETADA', 'done'],
  ['RECHAZADA', 'rejected'],
]

function renderBadge(status: OdcStatus) {
  const { container } = render(<OdcStatusBadge status={status} />)
  const badge = container.querySelector('[data-status]')
  if (!badge) throw new Error(`sin badge para ${status}`)
  return badge
}

describe('R1: el badge toma su color de los 8 pares de tokens --status-*', () => {
  it.each(STATUS_TOKENS)(
    '%s usa bg-status-%s-surface y text-status-%s',
    (status, token) => {
      const badge = renderBadge(status)

      expect(badge.className).toContain(`bg-status-${token}-surface`)
      expect(badge.className).toMatch(
        new RegExp(`\\btext-status-${token}\\b(?!-surface)`),
      )
    },
  )

  it('no reintroduce la inversión por tema con variantes dark: de color', () => {
    // La primitiva aporta `dark:aria-invalid:ring-*`; lo que R1 prohíbe es que
    // el mapa de estados vuelva a declarar fondo o texto por tema.
    for (const [status] of STATUS_TOKENS) {
      expect(renderBadge(status).className).not.toMatch(/dark:(?:bg|text)-/)
    }
  })
})

describe('R2: el badge conserva su contrato accesible y su transición', () => {
  it.each(STATUS_TOKENS)('%s expone data-status y su etiqueta textual', (status) => {
    const badge = renderBadge(status)

    expect(badge.getAttribute('data-status')).toBe(status)
    expect(badge.textContent).toBe(statusLabel(status))
  })

  it('es una etiqueta informativa, nunca un control', () => {
    const badge = renderBadge('BORRADOR')

    expect(badge.tagName).toBe('SPAN')
    expect(badge.getAttribute('role')).toBeNull()
    expect(badge.getAttribute('tabindex')).toBeNull()
  })

  it('conserva la ausencia de borde, el radio de la primitiva y la transición de 150ms', () => {
    const badge = renderBadge('COMPLETADA')

    expect(badge.className).toContain('border-0')
    expect(badge.className).toContain('rounded-badge')
    expect(badge.className).toContain('duration-150')
    expect(badge.className).toContain('motion-reduce:transition-none')
  })
})
