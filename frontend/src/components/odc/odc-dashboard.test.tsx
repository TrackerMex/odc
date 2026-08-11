import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type * as RouterModule from '@tanstack/react-router'
import type { Odc, OdcPage, OdcStatus } from '@/lib/odc'
import { OdcDashboard } from './odc-dashboard'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return {
    ...actual,
    Link: ({ children, to, params, ...props }: any) => (
      <a href={params?.id ? `/odcs/${params.id}` : to} {...props}>
        {children}
      </a>
    ),
  }
})

function odc(status: OdcStatus, id: string): Odc {
  return {
    id,
    odcNumber: `ODC-2026-${id.padStart(5, '0')}`,
    status,
    description: `Orden ${id}`,
    quantity: 2,
    unit: 'pieza',
    unitPriceCents: 10_000,
    totalCents: 20_000,
    supplier: 'Suntech',
    comments: null,
    createdById: 'u1',
    rejectionReason: null,
    paymentDate: null,
    paymentMethod: null,
    paymentReference: null,
    paymentNotes: null,
    hasPaymentEvidence: false,
    evidenceReference: null,
    hasInvoice: false,
    invoiceNumber: null,
    invoiceDate: null,
    warehouseEntryDate: null,
    observations: null,
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:00.000Z',
    history: [],
  }
}

function page(items: Odc[], total = items.length): OdcPage {
  return { items, total, page: 1, pageSize: 20 }
}

describe('R1,R12: DIRECTOR_OPS dashboard exposes four responsive workflow queues', () => {
  it('renders every counter, list item, detail link and create action', () => {
    render(
      <OdcDashboard
        userName="Ana Pérez"
        sections={{
          BORRADOR: page([odc('BORRADOR', '1')], 3),
          RECHAZADA: page([], 0),
          COMPRA_APROBADA: page([odc('COMPRA_APROBADA', '2')], 1),
          EVIDENCIA_PAGO_SUBIDA: page([], 2),
        }}
      />,
    )

    expect(screen.getByText(/buen día, ana pérez/i)).toBeTruthy()
    for (const label of [
      'Borradores',
      'Rechazadas',
      'Listas para comprar',
      'Pendientes de factura',
    ]) {
      expect(screen.getByText(label)).toBeTruthy()
    }
    expect(
      screen.getByRole('link', { name: /nueva odc/i }).getAttribute('href'),
    ).toBe('/odcs/new')
    expect(
      screen
        .getByRole('link', { name: /ODC-2026-00001/i })
        .getAttribute('href'),
    ).toBe('/odcs/1')
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })
})

const sections = {
  BORRADOR: page([odc('BORRADOR', '1')], 3),
  RECHAZADA: page([], 0),
  COMPRA_APROBADA: page([odc('COMPRA_APROBADA', '2')], 1),
  EVIDENCIA_PAGO_SUBIDA: page([], 2),
}

describe('ui-surfaces-dashboards R3,R4: consola de trabajo densa, no landing', () => {
  it('usa el ancho y el padding de página de la superficie de dashboard', () => {
    const { container } = render(
      <OdcDashboard userName="Ana Pérez" sections={sections} />,
    )

    const main = container.querySelector('main')!
    expect(main.className).toContain('min-w-0')
    expect(main.className).toContain('flex-1')
    expect(main.className).toContain('p-4')
    expect(main.className).toContain('sm:p-6')
    expect(main.className).not.toContain('lg:p-8')
    expect(container.querySelector('.max-w-\\[1400px\\]')).toBeTruthy()
    expect(container.querySelector('.max-w-7xl')).toBeNull()
  })

  it('reduce el header a un escalón tipográfico y suelta el párrafo de onboarding', () => {
    render(<OdcDashboard userName="Ana Pérez" sections={sections} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.className).toContain('text-2xl')
    expect(heading.className).not.toContain('text-3xl')
    expect(heading.className).not.toContain('sm:text-4xl')
    expect(screen.queryByText(/consulta tus órdenes activas/i)).toBeNull()
    expect(screen.getByText('Operaciones')).toBeTruthy()
  })
})

// Mapa de [[design]]: cada cola es un solo estado, así que la barra puede
// llevar su color sin mentir sobre el contenido.
const QUEUE_ACCENT: Array<[string, string]> = [
  ['Rechazadas', 'border-l-status-rejected'],
  ['Borradores', 'border-l-status-draft'],
  ['Listas para comprar', 'border-l-status-approved'],
  ['Pendientes de factura', 'border-l-status-evidence'],
]

function queueHeader(title: string) {
  return screen.getByText(title).closest('[data-slot="card-header"]')!
}

describe('ui-surfaces-dashboards R7,R8: cada cola se distingue de un vistazo', () => {
  it.each(QUEUE_ACCENT)(
    'la tarjeta %s lleva la barra de acento de su estado',
    (title, accent) => {
      render(<OdcDashboard userName="Ana Pérez" sections={sections} />)

      const header = queueHeader(title)
      expect(header.className).toContain('border-l-2')
      expect(header.className).toContain(accent)
      expect(header.className).toContain('pb-3')
    },
  )

  it('el contador baja de escalón y solo se tiñe cuando la cola está bloqueada', () => {
    render(<OdcDashboard userName="Ana Pérez" sections={sections} />)

    for (const [title] of QUEUE_ACCENT) {
      const counter = queueHeader(title).querySelector('.tabular-nums')!
      expect(counter.className).toContain('text-2xl')
      expect(counter.className).not.toContain('text-3xl')
    }
    expect(
      queueHeader('Rechazadas').querySelector('.tabular-nums')!.className,
    ).toContain('text-status-rejected')
    expect(
      queueHeader('Borradores').querySelector('.tabular-nums')!.className,
    ).toContain('text-muted-foreground')
  })

  it('el estado vacío baja de alto sin perder su borde discontinuo ni su mensaje', () => {
    render(<OdcDashboard userName="Ana Pérez" sections={sections} />)

    const empty = screen.getAllByText(/no hay órdenes en esta etapa/i)[0]
    expect(empty.className).toContain('min-h-20')
    expect(empty.className).toContain('border-dashed')
  })
})

describe('ui-surfaces-dashboards R6: los CTA del header cierran D-V3', () => {
  it('no sube la altura de la primitiva y conserva el anillo de foco', () => {
    render(<OdcDashboard userName="Ana Pérez" sections={sections} />)

    for (const name of [/nueva odc/i, /resumen mensual/i]) {
      const cta = screen.getByRole('link', { name })
      // `h-9` es la altura del tamaño `lg` de la primitiva: 36px, el defecto D-V3.
      expect(cta.className).not.toMatch(/\bh-9\b/)
      expect(cta.className).toMatch(/focus-visible:ring/)
    }
  })
})

describe('R13: DIRECTOR_OPS dashboard orders sections by visual priority', () => {
  it('places Rechazadas, Borradores, Listas para comprar and Pendientes de factura in that DOM order', () => {
    render(
      <OdcDashboard
        userName="Ana Pérez"
        sections={{
          BORRADOR: page([], 1),
          RECHAZADA: page([], 1),
          COMPRA_APROBADA: page([], 1),
          EVIDENCIA_PAGO_SUBIDA: page([], 1),
        }}
      />,
    )

    const rejected = screen.getByText('Rechazadas')
    const drafts = screen.getByText('Borradores')
    const readyToPurchase = screen.getByText('Listas para comprar')
    const pendingInvoice = screen.getByText('Pendientes de factura')

    expect(
      Boolean(
        rejected.compareDocumentPosition(drafts) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      Boolean(
        drafts.compareDocumentPosition(readyToPurchase) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      Boolean(
        readyToPurchase.compareDocumentPosition(pendingInvoice) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
  })
})
