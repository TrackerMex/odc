import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type * as RouterModule from '@tanstack/react-router'
import type { ExecutiveTaskPage } from '@/lib/odc'
import { ExecutiveTasks } from './executive-tasks'

vi.mock('@/lib/api', () => ({ getExecutiveTasks: vi.fn() }))
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

const taskPage: ExecutiveTaskPage = {
  total: 2,
  page: 1,
  pageSize: 20,
  items: [
    {
      id: 'draft-1',
      odcNumber: 'ODC-2026-00001',
      status: 'BORRADOR',
      description: 'Sensores para almacén',
      supplier: 'Suntech',
      totalCents: 250_000,
      createdAt: '2026-07-01T00:00:00.000Z',
      ageDays: 26,
      nextAction: 'EDITAR_Y_REENVIAR',
    },
    {
      id: 'budget-1',
      odcNumber: 'ODC-2026-00002',
      status: 'PENDIENTE_ADMIN',
      description: 'Licencias',
      supplier: 'Software MX',
      totalCents: 30_000,
      createdAt: '2026-07-05T00:00:00.000Z',
      ageDays: 22,
      nextAction: 'VALIDAR_PRESUPUESTO',
    },
  ],
}

describe('ui-surfaces-dashboards R3,R4: consola de trabajo densa, no landing', () => {
  it('usa el ancho y el padding de página de la superficie de dashboard', () => {
    const { container } = render(
      <ExecutiveTasks initialPage={taskPage} role="DIRECTOR_OPS" />,
    )

    const main = container.querySelector('main')!
    expect(main.className).toContain('min-w-0')
    expect(main.className).toContain('flex-1')
    expect(main.className).toContain('p-4')
    expect(main.className).toContain('sm:p-6')
    expect(main.className).not.toContain('lg:p-8')
    expect(container.querySelector('.max-w-\\[1400px\\]')).toBeTruthy()
    expect(container.querySelector('.max-w-5xl')).toBeNull()
  })

  it('reduce el header a un escalón tipográfico y suelta el párrafo de onboarding', () => {
    render(<ExecutiveTasks initialPage={taskPage} role="DIRECTOR_OPS" />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('Todas las tareas')
    expect(heading.className).toContain('text-2xl')
    expect(heading.className).not.toContain('text-3xl')
    expect(heading.className).not.toContain('sm:text-4xl')
    expect(screen.queryByText(/prioriza las órdenes más antiguas/i)).toBeNull()
    expect(screen.getByText('Bandeja de trabajo')).toBeTruthy()
  })
})
