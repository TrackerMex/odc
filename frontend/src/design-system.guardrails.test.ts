import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// R13 y R15 son los requisitos de "no regresión" de la spec: estos tests son
// guardas — nacen en verde y sólo se ponen rojos si el rediseño rompe algo que
// debía quedar intacto.

const projectDir = resolve(process.cwd())
const read = (relativePath: string) =>
  readFileSync(`${projectDir}/${relativePath}`, 'utf8')

const PRIMITIVES = [
  'button',
  'badge',
  'card',
  'input',
  'select',
  'textarea',
  'table',
  'field',
  'dialog',
] as const

// ui-surfaces-dashboards (fases 3a + 3e): los seis archivos del alcance de R15.
const SURFACES = [
  'odc-status-badge',
  'odc-dashboard',
  'admin-dashboard',
  'general-dashboard',
  'executive-dashboard',
  'executive-tasks',
] as const

const surfaceSource = (name: string) =>
  read(`src/components/odc/${name}.tsx`)

describe('ui-surfaces-dashboards R1: el badge deja de pintar paleta cruda', () => {
  const badge = () => surfaceSource('odc-status-badge')

  it.each([
    'draft',
    'pending',
    'budget',
    'approved',
    'paid',
    'evidence',
    'done',
    'rejected',
  ])('declara el par de tokens de status-%s', (token) => {
    expect(badge()).toContain(`bg-status-${token}-surface`)
    expect(badge()).toMatch(new RegExp(`\\btext-status-${token}\\b(?!-surface)`))
  })

  it('no conserva ninguna clase de paleta Tailwind', () => {
    expect(badge()).not.toMatch(
      /\b(?:bg|text)-(?:slate|amber|sky|blue|violet|cyan|emerald|red)-\d{2,3}\b/,
    )
  })

  it('no duplica la inversión de tema con variantes dark:', () => {
    expect(badge()).not.toContain('dark:')
  })
})

describe('R13: las 6 aserciones sobre className siguen intactas', () => {
  it.each([
    [
      'components/odc/executive-dashboard.test.tsx',
      'toMatch(/focus-visible:ring/)',
    ],
    [
      'components/odc/executive-dashboard.test.tsx',
      `container.querySelector('[class*="motion-reduce"]')`,
    ],
    [
      'components/odc/general-approval-actions.test.tsx',
      'expect(busy?.className).toMatch(/flex-col.*sm:flex-row/)',
    ],
    [
      'components/odc/general-dashboard.test.tsx',
      `expect(container.querySelector('main')?.className).toContain('min-w-0')`,
    ],
    [
      'components/odc/general-dashboard.test.tsx',
      'toMatch(/flex-col.*sm:flex-row/)',
    ],
    ['components/odc/monthly-summary.test.tsx', `'odc-filter-results',`],
  ])('%s conserva %s', (file, assertion) => {
    expect(read(`src/${file}`)).toContain(assertion)
  })
})

// Tracking de póster: 12px con 0.1em–0.18em es ilegible en una fila de tabla
// (MASTER §2). El label del sistema es 0.06em.
const FORBIDDEN_TRACKING = [
  'tracking-[0.1em]',
  'tracking-[0.12em]',
  'tracking-[0.14em]',
  'tracking-[0.18em]',
] as const

describe('ui-surfaces-dashboards R5: las etiquetas usan el tracking de label del MASTER', () => {
  it.each(SURFACES)('%s.tsx no usa tracking de póster', (surface) => {
    const source = surfaceSource(surface)
    for (const tracking of FORBIDDEN_TRACKING) {
      expect(source).not.toContain(tracking)
    }
  })

  it.each(SURFACES.filter((surface) => surface !== 'odc-status-badge'))(
    '%s.tsx declara el tracking de label',
    (surface) => {
      expect(surfaceSource(surface)).toContain('tracking-[0.06em]')
    },
  )
})

describe('ui-surfaces-dashboards R6: las acciones no sobreescriben la densidad de la primitiva', () => {
  it.each(SURFACES)('%s.tsx no fuerza el tamaño lg', (surface) => {
    expect(surfaceSource(surface)).not.toMatch(/size:\s*'lg'|size="lg"/)
  })

  it('odc-dashboard.tsx usa el tamaño sm que prescribe pages/dashboard.md', () => {
    expect(surfaceSource('odc-dashboard')).toMatch(/size:\s*'sm'/)
  })
})

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const LITERAL_COLOR = new RegExp(
  [
    '#[0-9a-fA-F]{3,8}\\b',
    `\\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|placeholder|caret|decoration)-(?:${PALETTE})-\\d{2,3}`,
    '\\b(?:bg|text|border|ring|outline|fill|stroke)-(?:black|white)(?:/\\d+)?\\b',
  ].join('|'),
  'g',
)

describe('ui-surfaces-dashboards R10: cada caja usa el radio de su token', () => {
  it.each(SURFACES)('%s.tsx no usa rounded-xl ni rounded-2xl', (surface) => {
    expect(surfaceSource(surface)).not.toMatch(/\brounded-2?xl\b/)
  })
})

describe('ui-surfaces-dashboards R11: cero color literal en las seis superficies', () => {
  it.each(SURFACES)('%s.tsx no usa hex crudo ni clase de paleta', (surface) => {
    expect([...surfaceSource(surface).matchAll(LITERAL_COLOR)]).toEqual([])
  })

  it('las alertas de antigüedad usan el par --status-pending', () => {
    const source = surfaceSource('executive-dashboard')
    expect(source).toContain('border-status-pending')
    expect(source).toContain('text-status-pending')
  })
})

describe('R15: sin dependencias nuevas y sin color literal en las primitivas', () => {
  // Congelado en la aprobación de la spec (2026-08-10).
  const FROZEN_DEPENDENCIES = [
    '@base-ui/react',
    '@fontsource-variable/geist',
    '@fontsource-variable/inter',
    '@tailwindcss/vite',
    '@tanstack/react-devtools',
    '@tanstack/react-form',
    '@tanstack/react-query',
    '@tanstack/react-router',
    '@tanstack/react-router-devtools',
    '@tanstack/react-router-ssr-query',
    '@tanstack/react-start',
    '@tanstack/router-plugin',
    'class-variance-authority',
    'clsx',
    'date-fns',
    'html-to-image',
    'jspdf',
    'lucide-react',
    'react',
    'react-day-picker',
    'react-dom',
    'tailwind-merge',
    'tailwindcss',
    'tw-animate-css',
    'zod',
    'zustand',
  ]
  const FROZEN_DEV_DEPENDENCIES = [
    '@playwright/test',
    '@tailwindcss/typography',
    '@tanstack/devtools-vite',
    '@tanstack/eslint-config',
    '@tanstack/router-cli',
    '@testing-library/dom',
    '@testing-library/react',
    '@types/node',
    '@types/react',
    '@types/react-dom',
    '@vitejs/plugin-react',
    'eslint',
    'jsdom',
    'prettier',
    'shadcn',
    'typescript',
    'vite',
    'vitest',
  ]

  it('no añade dependencias a frontend/package.json', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(Object.keys(pkg.dependencies).sort()).toEqual(
      [...FROZEN_DEPENDENCIES].sort(),
    )
    expect(Object.keys(pkg.devDependencies).sort()).toEqual(
      [...FROZEN_DEV_DEPENDENCIES].sort(),
    )
  })

  it.each(PRIMITIVES)('%s.tsx no usa color literal', (primitive) => {
    const source = read(`src/components/ui/${primitive}.tsx`)
    const literals = [...source.matchAll(LITERAL_COLOR)].map(
      (match) => match[0],
    )
    // Única excepción del MASTER §6: el backdrop del diálogo.
    const allowed = primitive === 'dialog' ? ['bg-black/30'] : []
    expect(literals.filter((literal) => !allowed.includes(literal))).toEqual([])
  })

  it('monthly-summary-slide.tsx conserva sus clases de paleta literales', () => {
    const slide = read('src/components/odc/monthly-summary-slide.tsx')
    expect(slide).toContain('bg-white')
    expect(slide).toMatch(/text-slate-\d{2,3}/)
    expect(slide).toMatch(/border-slate-\d{2,3}/)
  })

  // La guarda anterior sólo vale si el detector realmente detecta: se calibra
  // contra el único archivo del repo que sí tiene color crudo por diseño.
  it('el detector de color literal no es vacuo', () => {
    const slide = read('src/components/odc/monthly-summary-slide.tsx')
    expect([...slide.matchAll(LITERAL_COLOR)].length).toBeGreaterThan(0)
  })
})
