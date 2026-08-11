import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from './badge'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Dialog, DialogContent, DialogTitle } from './dialog'
import { FieldError } from './field'
import { Input } from './input'
import { Select, SelectTrigger, SelectValue } from './select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Textarea } from './textarea'

const uiDir = resolve(process.cwd(), 'src/components/ui')
const source = (file: string) => readFileSync(`${uiDir}/${file}`, 'utf8')

const classesOf = (element: Element | null | undefined) => {
  expect(element).toBeTruthy()
  return element!.className
}

const utilityTokens = (className: string) => className.split(/\s+/)

describe('R7: botón h-8, radio --radius, peso 500 y variante confirm', () => {
  it('el tamaño por defecto mide 2rem, pad 0.75rem y usa el radio de control', () => {
    render(<Button>Guardar</Button>)
    const cls = classesOf(screen.getByRole('button'))
    expect(cls).toContain('h-8')
    expect(cls).toContain('px-3')
    expect(cls).toContain('font-medium')
    expect(cls).toMatch(/rounded-\(--radius\)/)
  })

  it('conserva el anillo de foco de 3px', () => {
    render(<Button>Guardar</Button>)
    const cls = classesOf(screen.getByRole('button'))
    expect(cls).toMatch(/focus-visible:ring-(3|\[3px\])/)
    expect(cls).toContain('focus-visible:ring-ring/30')
  })

  it('la variante confirm usa el par accent-action', () => {
    render(<Button variant="confirm">Registrar pago</Button>)
    const cls = classesOf(screen.getByRole('button'))
    expect(cls).toContain('bg-accent-action')
    expect(cls).toContain('text-accent-action-foreground')
  })

  it('ninguna variante ni tamaño emite rounded-2xl', () => {
    expect(source('button.tsx')).not.toContain('rounded-2xl')
  })
})

describe('R8: input, select y textarea con radio y foco del sistema', () => {
  it('Input usa --radius, mide 2rem y conserva el foco', () => {
    render(<Input aria-label="Folio" />)
    const cls = classesOf(screen.getByLabelText('Folio'))
    expect(cls).toMatch(/rounded-\(--radius\)/)
    expect(cls).not.toContain('rounded-2xl')
    expect(cls).toContain('h-8')
    expect(cls).toMatch(/focus-visible:ring-(3|\[3px\])/)
  })

  it('Textarea usa --radius y conserva el foco', () => {
    render(<Textarea aria-label="Comentarios" />)
    const cls = classesOf(screen.getByLabelText('Comentarios'))
    expect(cls).toMatch(/rounded-\(--radius\)/)
    expect(cls).not.toContain('rounded-2xl')
    expect(cls).toMatch(/focus-visible:ring-(3|\[3px\])/)
  })

  it('SelectTrigger usa --radius y mide 2rem en su tamaño por defecto', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>,
    )
    const cls = classesOf(
      container.querySelector('[data-slot="select-trigger"]'),
    )
    expect(cls).toMatch(/rounded-\(--radius\)/)
    expect(cls).not.toContain('rounded-2xl')
    expect(cls).toContain('data-[size=default]:h-8')
    expect(cls).toMatch(/focus-visible:ring-(3|\[3px\])/)
  })

  it('FieldError emite role="alert" con children y con errors', () => {
    const { rerender } = render(<FieldError>Campo obligatorio</FieldError>)
    expect(screen.getByRole('alert').textContent).toBe('Campo obligatorio')

    rerender(<FieldError errors={[{ message: 'Monto inválido' }]} />)
    expect(screen.getByRole('alert').textContent).toBe('Monto inválido')
  })
})

describe('R9: card con --radius-card, padding 1rem, shadow-xs y borde', () => {
  it('aplica el radio de tarjeta, el padding y la elevación del MASTER §4', () => {
    const { container } = render(
      <Card>
        <CardContent>Total</CardContent>
      </Card>,
    )
    const cls = classesOf(container.querySelector('[data-slot="card"]'))
    expect(cls).toContain('rounded-card')
    expect(cls).toContain('[--card-spacing:--spacing(4)]')
    expect(cls).toContain('shadow-xs')
    expect(utilityTokens(cls)).toContain('border')
    expect(cls).toContain('border-border')
  })

  it('no eleva ni desplaza la tarjeta en hover', () => {
    const cardSource = source('card.tsx')
    const hoverUtilities = [
      ...cardSource.matchAll(/hover:[\w[\]/.()-]+/g),
    ].map((match) => match[0])
    expect(
      hoverUtilities.filter((utility) =>
        /translate|scale|shadow|cursor/.test(utility),
      ),
    ).toEqual([])
    expect(cardSource).not.toContain('cursor-pointer')
  })
})

describe('R10: tabla con fila 2.25rem, header sticky y overflow-x-auto', () => {
  const renderTable = () =>
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow data-testid="data-row">
            <TableCell>ODC-2026-00001</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

  it('conserva la estructura semántica y el contenedor con overflow-x-auto', () => {
    const { container } = renderTable()
    expect(
      classesOf(container.querySelector('[data-slot="table-container"]')),
    ).toContain('overflow-x-auto')
    expect(container.querySelector('table > thead > tr > th')).toBeTruthy()
    expect(container.querySelector('table > tbody > tr > td')).toBeTruthy()
  })

  it('las filas de datos miden 2.25rem con celdas de 0.5rem 0.75rem', () => {
    const { container } = renderTable()
    const row = classesOf(container.querySelector('[data-testid="data-row"]'))
    expect(row).toContain('h-9')
    expect(row).toContain('border-b')
    const cell = classesOf(container.querySelector('[data-slot="table-cell"]'))
    expect(cell).toContain('px-3')
    expect(cell).toContain('py-2')
  })

  it('el header es sticky sobre superficie opaca y no hay zebra', () => {
    const { container } = renderTable()
    const head = classesOf(container.querySelector('[data-slot="table-header"]'))
    expect(head).toContain('sticky')
    expect(head).toContain('top-0')
    expect(head).toMatch(/bg-(card|background|popover)\b/)
    expect(source('table.tsx')).not.toMatch(/\b(odd|even):/)
  })
})

describe('R11: badge con --radius-badge y sin borde visible', () => {
  it('usa el radio de badge, text-xs, peso 500 y conserva el foco', () => {
    const { container } = render(<Badge>BORRADOR</Badge>)
    const cls = classesOf(container.querySelector('[data-slot="badge"]'))
    expect(cls).toContain('rounded-badge')
    expect(cls).toContain('text-xs')
    expect(cls).toContain('font-medium')
    expect(cls).toMatch(/focus-visible:ring-(3|\[3px\])/)
  })

  it('no emite ninguna utilidad de borde ni rounded-2xl', () => {
    const { container } = render(<Badge>BORRADOR</Badge>)
    const cls = classesOf(container.querySelector('[data-slot="badge"]'))
    expect(utilityTokens(cls).filter((token) => /(^|:)border(-|$)/.test(token)))
      .toEqual([])
    expect(source('badge.tsx')).not.toContain('rounded-2xl')
  })
})

describe('R12: diálogo con --radius-card, padding 1.25rem y shadow-xl', () => {
  const renderDialog = () =>
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Confirmar rechazo</DialogTitle>
        </DialogContent>
      </Dialog>,
    )

  it('aplica radio de tarjeta, padding 1.25rem y shadow-xl', () => {
    renderDialog()
    const cls = classesOf(
      document.querySelector('[data-slot="dialog-content"]'),
    )
    expect(cls).toContain('rounded-card')
    expect(cls).toContain('p-5')
    expect(cls).toContain('shadow-xl')
  })

  it('conserva el backdrop negro al 30% con blur y la animación de apertura', () => {
    renderDialog()
    const backdrop = classesOf(
      document.querySelector('[data-slot="dialog-overlay"]'),
    )
    expect(backdrop).toContain('bg-black/30')
    expect(backdrop).toContain('backdrop-blur-sm')
    expect(
      classesOf(document.querySelector('[data-slot="dialog-content"]')),
    ).toContain('data-open:animate-in')
  })

  it('conserva el botón de cierre con texto accesible', () => {
    renderDialog()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy()
  })
})
