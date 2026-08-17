import { readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// R13 y R15 son los requisitos de "no regresión" de la spec: estos tests son
// guardas — nacen en verde y sólo se ponen rojos si el rediseño rompe algo que
// debía quedar intacto.

const projectDir = resolve(process.cwd())
const repoRoot = `${resolve(process.cwd(), '..')}/`
const read = (relativePath: string) =>
  readFileSync(`${projectDir}/${relativePath}`, 'utf8')
const readRepo = (relativePath: string) =>
  readFileSync(`${repoRoot}${relativePath}`, 'utf8')

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

// Superficies activas conservadas tras ui-dead-surfaces-audit.
const SURFACES = [
  'odc-status-badge',
  'executive-dashboard',
  'executive-tasks',
  'monthly-summary',
] as const

const surfaceSource = (name: string) => read(`src/components/odc/${name}.tsx`)

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
    expect(badge()).toMatch(
      new RegExp(`\\btext-status-${token}\\b(?!-surface)`),
    )
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

describe('R13: las 4 aserciones sobre className siguen intactas', () => {
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

describe('R15: sin dependencias nuevas y sin color literal en las primitivas', () => {
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

describe('ui-surfaces-detail-forms R14: preservación transversal', () => {
  const affectedSurfaces = [
    'admin-budget-actions',
    'general-approval-actions',
    'odc-detail',
    'odc-document-preview',
    'odc-form',
    'payment-evidence-form',
    'register-payment-form',
    'upload-invoice-form',
  ] as const

  it.each(affectedSurfaces)('%s usa solo colores semánticos', (surface) => {
    expect([...surfaceSource(surface).matchAll(LITERAL_COLOR)]).toEqual([])
  })

  it('mantiene layouts apilados, anchos mínimos y breakpoints acotados', () => {
    expect(surfaceSource('odc-detail')).toContain('grid min-w-0')
    expect(surfaceSource('odc-detail')).toContain('sm:grid-cols-2')
    expect(surfaceSource('general-approval-actions')).toMatch(
      /flex flex-col.*sm:flex-row/,
    )
    expect(surfaceSource('odc-form')).toContain('min-w-0')
  })

  it('protege indicadores de carga añadidos frente a reduced motion', () => {
    for (const surface of [
      'odc-form',
      'payment-evidence-form',
      'register-payment-form',
      'upload-invoice-form',
    ] as const) {
      const source = surfaceSource(surface)
      if (source.includes('animate-spin')) {
        expect(source).toContain('motion-reduce:animate-none')
      }
    }
  })
})

// Las guardas de R12, R13 y R15 nacen en verde por construcción: afirman que
// algo que ya está bien sigue estando bien. Se ponen rojas si esta feature —
// o la siguiente — rompe lo que debía quedar intacto.
describe('ui-surfaces-dashboards R12: las 3 aserciones en riesgo siguen intactas', () => {
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
      'components/odc/executive-dashboard.test.tsx',
      'expect(header.textContent).toMatch(/operaciones/i)',
    ],
  ])('%s conserva %s', (file, assertion) => {
    expect(read(`src/${file}`)).toContain(assertion)
  })
})

describe('ui-surfaces-dashboards R13: los tests no fijan valores visuales inventados', () => {
  const FEATURE_TESTS = [
    'src/design-system.guardrails.test.ts',
    ...SURFACES.map((surface) => `src/components/odc/${surface}.test.tsx`),
  ]
  // Un valor arbitrario de Tailwind (`max-w-[1400px]`, `tracking-[0.06em]`) es
  // donde se cuela un número inventado. Los cuatro trackings prohibidos se
  // afirman ausentes, no fijados, así que no necesitan respaldo documental.
  const ARBITRARY_VALUE = /[\w-]*\[[^\]\s]*\d[^\]\s]*(?:px|rem|em)\]/g
  const arbitraryValues = (file: string) =>
    // Los backslashes de los selectores CSS escapados estorban al detector.
    [...read(file).replace(/\\/g, '').matchAll(ARBITRARY_VALUE)]
      .map((match) => match[0])
      .filter((value) => !FORBIDDEN_TRACKING.includes(value as never))

  const NORMATIVE = () =>
    readRepo('design-system/odc/MASTER.md') +
    readRepo('design-system/odc/pages/dashboard.md') +
    readRepo('design-system/odc/pages/monthly-summary.md')

  it.each(FEATURE_TESTS)(
    '%s solo fija valores escritos en la fuente normativa',
    (file) => {
      const docs = NORMATIVE()
      for (const value of arbitraryValues(file)) {
        expect(docs).toContain(value)
      }
    },
  )

  it('la auditoría no es vacua: encuentra los valores que la feature sí fija', () => {
    const found = FEATURE_TESTS.flatMap(arbitraryValues)
    expect(found).toContain('max-w-[1400px]')
    expect(found).toContain('tracking-[0.06em]')
  })
})

describe('ui-surfaces-dashboards R14: la verificación en navegador existe', () => {
  // El contenido lo juzga un humano; el test solo garantiza que el acta existe
  // y declara sus cinco secciones. Un invariante verde puede seguir viéndose
  // mal: esa es la razón de que la fase 3a exista.
  it.each([
    '## 1. Las cuatro superficies en los dos temas',
    '## 2. Altura computada de los CTA del header',
    '## 3. Las 8 badges con los tokens nuevos',
    '## 4. Las barras de acento de las tarjetas de cola',
    '## 5. Veredicto humano',
    '### Observación: saturación de las badges de dark',
  ])('el acta declara la sección "%s"', (heading) => {
    expect(readRepo('progress/verify_ui-surfaces-dashboards.md')).toContain(
      heading,
    )
  })
})

describe('ui-surfaces-dashboards R15: alcance cerrado, sin tokens ni dependencias nuevas', () => {
  it('las utilidades de estado de las superficies activas ya existen en @theme inline', () => {
    const theme = read('src/styles.css')
    const used = new Set(
      SURFACES.flatMap((surface) => [
        ...surfaceSource(surface).matchAll(
          /(?:bg|text|border|border-l)-(status-[\w-]+?)(?:\/\d+)?(?=["'\s`])/g,
        ),
      ]).map((match) => match[1]),
    )

    expect(used.size).toBeGreaterThan(0)
    for (const token of used) {
      expect(theme).toContain(`--color-${token}:`)
    }
  })

  it('no declara tokens de estado nuevos en styles.css', () => {
    expect([
      ...read('src/styles.css').matchAll(/--color-status-[\w-]+:/g),
    ]).toHaveLength(16)
  })

  it('no añade dependencias a frontend/package.json', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(
      Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }),
    ).toHaveLength(FROZEN_DEPENDENCIES.length + FROZEN_DEV_DEPENDENCIES.length)
  })
})

describe('ui-surfaces-monthly-summary R6: the export slide exception is documented', () => {
  it('explains why literal light-theme colors must remain in the PDF render', () => {
    const slide = surfaceSource('monthly-summary-slide')

    expect(slide).toMatch(/PDF.*html-to-image|html-to-image.*PDF/)
  })
})

describe('ui-surfaces-monthly-summary R8: the active surface is audited', () => {
  it('includes monthly-summary and excludes the intentionally literal slide', () => {
    expect(SURFACES).toContain('monthly-summary')
    expect(SURFACES).not.toContain('monthly-summary-slide')
  })
})

describe('ui-surfaces-monthly-summary R9: browser verification record exists', () => {
  it.each([
    '## 1. La superficie en los dos temas',
    '## 2. Jerarquía tipográfica del total',
    '## 3. Las barras de etapa',
    '## 4. La tabla de detalle',
    '## 5. La exportación PNG y PDF',
    '## 6. Veredicto humano',
  ])('declares the section "%s"', (heading) => {
    expect(
      readRepo('progress/verify_ui-surfaces-monthly-summary.md'),
    ).toContain(heading)
  })
})

describe('ui-surfaces-monthly-summary R10: existing summary assertions stay intact', () => {
  it.each([
    "'odc-filter-results',",
    "getByRole('button', { name: 'Página siguiente' })",
    "getByRole('button', { name: 'Imagen' })",
    "getByRole('button', { name: 'PDF' })",
  ])('preserves %s', (assertion) => {
    expect(read('src/components/odc/monthly-summary.test.tsx')).toContain(
      assertion,
    )
  })
})

// --- ui-responsive-375 -------------------------------------------------------
//
// El acta `progress/verify_ui-responsive-375.md` es el entregable de la feature:
// R1, R3, R7 y R8 solo se pueden observar en un navegador real, así que lo que
// Vitest puede afirmar es que su sección correspondiente existe, está rellenada
// con medidas y no sigue en `PENDIENTE`. La medición la toma
// `frontend/e2e/responsive-375.spec.ts` bajo el gate de R1.
const ACTA = 'progress/verify_ui-responsive-375.md'
const ACTA_HEADINGS = [
  '## 0. Gate de medición',
  '## 1. /login',
  '## 2. / (portada ejecutiva)',
  '## 3. /tasks',
  '## 4. /odcs/new',
  '## 5. /odcs/$id',
  '## 6. /monthly-summary',
  '## 7. Área táctil',
  '## 8. Veredicto humano',
] as const

function actaSection(index: number): string {
  const acta = readRepo(ACTA)
  const heading = ACTA_HEADINGS[index]
  const start = acta.indexOf(heading)
  expect(start, `el acta declara "${heading}"`).toBeGreaterThanOrEqual(0)
  const end =
    index + 1 < ACTA_HEADINGS.length
      ? acta.indexOf(ACTA_HEADINGS[index + 1], start)
      : -1
  return acta.slice(start + heading.length, end < 0 ? acta.length : end)
}

describe('ui-responsive-375 R1: el acta abre con el gate de medición', () => {
  it.each([
    'window.innerWidth',
    'document.documentElement.clientWidth',
    'window.devicePixelRatio',
    'min-width: 40rem',
    'min-width: 48rem',
  ])('la sección 0 registra la lectura "%s"', (reading) => {
    expect(actaSection(0)).toContain(reading)
  })

  it('la sección 0 nombra el instrumento y no sigue pendiente', () => {
    const gate = actaSection(0)

    expect(gate).not.toContain('PENDIENTE')
    // R1 descarta `resize_window` como método único: el acta debe nombrar
    // Playwright (`setViewportSize`) o la emulación de dispositivo de Chrome.
    expect(gate).toMatch(/setViewportSize|emulación de dispositivo/)
  })
})

// Las seis secciones de ruta del acta, en el orden de ACTA_HEADINGS.
const ROUTE_SECTIONS = [1, 2, 3, 4, 5, 6] as const

// Superficies montadas en rutas de producción, según §"Superficies en alcance"
// de la spec. Ninguna superficie sin ruta entra aquí (feature 30).
const MOUNTED_SURFACES = [
  'LoginForm',
  'AppLayout',
  'AppSidebar',
  'SidebarTrigger',
  'ExecutiveDashboard',
  'OdcStatusBadge',
  'ExecutiveTasks',
  'OdcForm',
  'OdcDetail',
  'OdcDocumentPreview',
  'AdminBudgetActions',
  'GeneralApprovalActions',
  'RegisterPaymentForm',
  'PaymentEvidenceForm',
  'UploadInvoiceForm',
  'MonthlySummary',
  'MonthlySummarySlide',
  'OdcPagePending',
  'OdcPageError',
  'RolePlaceholder',
] as const

// Cada bloque de acciones de `/odcs/$id` exige su propio estado (R2).
const ACTION_STATES = [
  'PENDIENTE_ADMIN',
  'PRESUPUESTO_APROBADO',
  'COMPRA_APROBADA',
  'EVIDENCIA_PAGO_SUBIDA',
  'PAGO_REGISTRADO',
] as const

const SUPERSEDED_SURFACES = [
  'admin-dashboard',
  'general-dashboard',
  'odc-dashboard',
] as const

describe('ui-responsive-375 R2: el inventario auditado son las superficies vivas', () => {
  it.each(ROUTE_SECTIONS)(
    'la sección %i del acta está observada, no pendiente',
    (index) => {
      // `\b` deja fuera `PENDIENTE_ADMIN`, que es un estado de ODC observado,
      // no una sección sin rellenar.
      expect(actaSection(index)).not.toMatch(/\bPENDIENTE\b/)
    },
  )

  it.each(MOUNTED_SURFACES)('el acta observa %s', (surface) => {
    expect(readRepo(ACTA)).toContain(surface)
  })

  it.each(ACTION_STATES)(
    'el acta observa el bloque de acciones de %s',
    (state) => {
      expect(actaSection(5)).toContain(state)
    },
  )

  it.each(SUPERSEDED_SURFACES)(
    'no audita ni menciona la superficie sin ruta %s',
    (surface) => {
      expect(readRepo(ACTA)).not.toContain(surface)
    },
  )

  // La guarda de alcanzabilidad de la feature 30 sigue en verde y sin editarse:
  // si alguien la debilita, esta feature deja de auditar el inventario real.
  it.each([
    "expect(reachable.has(executiveDashboard)).toBe(true)",
    "'components/odc/monthly-summary-slide.tsx',",
    "'components/odc/odc-detail.tsx',",
  ])('production-reachability.test.ts conserva %s', (assertion) => {
    expect(read('src/components/odc/production-reachability.test.ts')).toContain(
      assertion,
    )
  })
})

describe('ui-responsive-375 R3: cada ruta registra su par de anchos medidos', () => {
  const measured = (section: string, property: string) => {
    const match = section.match(
      new RegExp(`documentElement\\.${property}\`?\\s*=\\s*(\\d+)`),
    )
    expect(match, `la sección registra documentElement.${property}`).not.toBeNull()
    return Number(match![1])
  }

  it.each(ROUTE_SECTIONS)(
    'la sección %i cumple scrollWidth <= clientWidth + 1',
    (index) => {
      const section = actaSection(index)
      const scrollWidth = measured(section, 'scrollWidth')
      const clientWidth = measured(section, 'clientWidth')

      // El margen de 1px absorbe el redondeo sub-pixel (R3).
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
    },
  )

  // El desbordamiento interno de la tabla del resumen mensual está prescrito
  // por MASTER §6 y §8: el acta debe distinguirlo del scroll de página.
  it('la sección 6 declara que el overflow de la tabla no es defecto', () => {
    expect(actaSection(6)).toMatch(/overflow-x/)
    expect(actaSection(6)).toMatch(/no es defecto|interno/)
  })
})

// Toda la fuente de producción del frontend, que es donde R4 prohíbe un ancho
// fijo mayor que el viewport auditado.
function productionSources(directory = `${projectDir}/src`): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) return productionSources(path)
    if (!entry.name.endsWith('.tsx')) return []
    if (entry.name.includes('.test.') || entry.name.includes('.spec.')) return []
    return [path]
  })
}

// `w-[<n>px]` / `min-w-[<n>px]` y su equivalente en rem. `max-w-` queda fuera a
// propósito: acota, no fija. El grupo 1 recoge la cadena de prefijos, que es lo
// que distingue un ancho de escritorio (`sm:w-…`) de uno que se aplica a 375px.
const FIXED_WIDTH = /(?:^|[\s"'`])((?:[a-z0-9]+:)*)(?:min-)?w-\[(\d+(?:\.\d+)?)(px|rem)\]/g
const RESPONSIVE_PREFIX = /\b(?:sm|md|lg|xl|2xl):/
const AUDITED_VIEWPORT = 375
const ROOT_PIXELS_PER_REM = 16

function surfacesWithFixedWidthAboveViewport(): string[] {
  const offenders = new Set<string>()
  for (const path of productionSources()) {
    const source = readFileSync(path, 'utf8')
    for (const match of source.matchAll(FIXED_WIDTH)) {
      const [, prefixes, value, unit] = match
      if (RESPONSIVE_PREFIX.test(prefixes)) continue
      const pixels =
        unit === 'rem' ? Number(value) * ROOT_PIXELS_PER_REM : Number(value)
      if (pixels > AUDITED_VIEWPORT) {
        offenders.add(relative(projectDir, path).replace(/\\/g, '/'))
      }
    }
  }
  return [...offenders].sort()
}

describe('ui-responsive-375 R4: la precondición de 375px se conserva en la fuente', () => {
  it('routes/__root.tsx conserva la meta viewport', () => {
    const root = read('src/routes/__root.tsx')

    expect(root).toContain("name: 'viewport'")
    expect(root).toContain("content: 'width=device-width, initial-scale=1'")
  })

  // La única excepción admitida, codificada por nombre: es el render del PDF,
  // vive fuera del lienzo y no aporta scrollWidth (ver sección 6 del acta).
  it('solo el slide del PDF declara un ancho fijo mayor que el viewport', () => {
    expect(surfacesWithFixedWidthAboveViewport()).toEqual([
      'src/components/odc/monthly-summary-slide.tsx',
    ])
  })

  it('la excepción sigue condicionada al contenedor fuera de pantalla', () => {
    const summary = surfaceSource('monthly-summary')

    expect(summary).toMatch(/fixed top-0 left-\[-\d+px\]/)
    expect(summary).toContain('aria-hidden="true"')
  })
})

// Patrones responsive vigentes en las superficies vivas. Esta feature verifica
// 375px: no puede retirarlos ni debilitarlos, y si una corrección de R6
// exigiera cambiar uno, se conserva el patrón y se busca otra salida.
const STACKED_ACTION_ROWS = [
  'general-approval-actions',
  'admin-budget-actions',
  'register-payment-form',
  'payment-evidence-form',
  'upload-invoice-form',
  'odc-form',
] as const

describe('ui-responsive-375 R5: los patrones responsive vigentes siguen intactos', () => {
  it.each(STACKED_ACTION_ROWS)(
    '%s.tsx apila la fila de acciones bajo sm',
    (surface) => {
      expect(surfaceSource(surface)).toMatch(/flex flex-col[^"'`]*sm:flex-row/)
    },
  )

  it('odc-detail.tsx conserva la rejilla apilada con min-w-0', () => {
    const detail = surfaceSource('odc-detail')

    expect(detail).toContain('grid min-w-0')
    expect([...detail.matchAll(/sm:grid-cols-2/g)]).toHaveLength(3)
  })

  it('odc-form.tsx conserva el min-w-0 del formulario', () => {
    expect(surfaceSource('odc-form')).toContain('min-w-0')
  })

  it('executive-dashboard.tsx oculta la cabecera de columnas bajo lg', () => {
    expect(surfaceSource('executive-dashboard')).toMatch(/hidden[^"'`]*lg:grid\b/)
  })

  it('pagination.tsx oculta las etiquetas de página bajo sm', () => {
    expect([
      ...read('src/components/ui/pagination.tsx').matchAll(/hidden sm:block/g),
    ]).toHaveLength(2)
  })

  it('table.tsx conserva el wrapper con overflow horizontal', () => {
    expect(read('src/components/ui/table.tsx')).toContain('overflow-x-auto')
  })

  it('los diálogos acotan su ancho en base y lo amplían desde sm', () => {
    expect(read('src/components/ui/dialog.tsx')).toContain(
      'max-w-[calc(100%-2rem)]',
    )
    expect(read('src/components/ui/dialog.tsx')).toContain('sm:max-w-md')
    expect(surfaceSource('odc-document-preview')).toContain('sm:max-w-5xl')
  })

  it('el sidebar sigue pasando a Sheet por debajo de 768px', () => {
    expect(read('src/hooks/use-mobile.ts')).toContain('MOBILE_BREAKPOINT = 768')
    expect(read('src/components/ui/sidebar.tsx')).toContain('useIsMobile')
  })

  // Las cuatro aserciones en riesgo del plan siguen vivas; la de la fila de
  // acciones es la que más directamente choca con un cambio responsive.
  it('la guarda equivalente de este archivo conserva su aserción de fila apilada', () => {
    expect(read('src/design-system.guardrails.test.ts')).toContain(
      "expect(surfaceSource('general-approval-actions')).toMatch(",
    )
    expect(read('src/components/odc/general-approval-actions.test.tsx')).toContain(
      'expect(busy?.className).toMatch(/flex-col.*sm:flex-row/)',
    )
  })
})

// Los tres puntos que la spec identificó de antemano. Ninguno puede quedar sin
// respuesta: el veredicto es "correcto a 375px" o "defecto".
const VERDICT = /correcto a 375px|defecto/
const MEASURED_PIXELS = /\d+(?:\.\d+)?px/

function verdictBlock(section: string, id: string): string {
  const start = section.indexOf(id)
  expect(start, `el acta emite el veredicto ${id}`).toBeGreaterThanOrEqual(0)
  const rest = section.slice(start)
  const next = rest.indexOf('**R7-', id.length)
  return next < 0 ? rest : rest.slice(0, next)
}

describe('ui-responsive-375 R7: los tres sospechosos reciben veredicto', () => {
  it.each([
    ['**R7-1**', 6, 'monthly-summary.tsx', 'grid-cols-3'],
    ['**R7-2**', 5, 'odc-detail.tsx', 'grid-cols-[minmax'],
    ['**R7-3**', 6, 'monthly-summary-slide.tsx', 'w-['],
  ])('%s queda cerrado en la sección %i', (id, index, file, marker) => {
    const block = verdictBlock(actaSection(index), id)

    expect(block).toContain(file)
    expect(block).toContain(marker)
    expect(block).toMatch(MEASURED_PIXELS)
    expect(block).toMatch(VERDICT)
  })

  it('R7-3 se cierra con la medición de scrollWidth de R3', () => {
    const block = verdictBlock(actaSection(6), '**R7-3**')

    expect(block).toContain('scrollWidth')
    expect(block).toMatch(/\b0\s*px|cero p[íi]xeles/)
  })
})

const TOUCH_MINIMUM = 44

describe('ui-responsive-375 R8: el área táctil se mide y se declara', () => {
  it.each([
    'SidebarTrigger',
    'Aprobar presupuesto',
    'ODC-2026-00014',
    'Siguiente',
  ])('la sección 7 registra el rectángulo de %s', (control) => {
    expect(actaSection(7)).toContain(control)
  })

  it('la sección 7 contrasta contra el mínimo de MASTER y nombra la deuda', () => {
    const touch = actaSection(7)

    expect(touch).toContain(`${TOUCH_MINIMUM}`)
    expect(touch).toMatch(/deuda/i)
    // Cuatro rectángulos medidos, uno por control exigido por R8.
    expect(
      [...touch.matchAll(/\d+(?:\.\d+)?\s*×\s*\d+(?:\.\d+)?px/g)].length,
    ).toBeGreaterThanOrEqual(4)
  })

  // Esta feature mide; no toca el dial de densidad de la feature 23.
  it('la densidad de la feature 23 sigue fijada por sus tests', () => {
    const tokens = read('src/components/ui/primitives.tokens.test.tsx')

    expect([...tokens.matchAll(/expect\(cls\)\.toContain\('h-8'\)/g)]).toHaveLength(2)
    expect(tokens).toContain("data-[size=default]:h-8")
  })

  it('las alturas de control siguen siendo las de la primitiva', () => {
    const button = read('src/components/ui/button.tsx')

    expect(button).toMatch(/"h-8 gap-1\.5 px-3/)
    expect(button).toContain('"icon-sm": "size-7"')
  })
})

describe('ui-responsive-375 R6: la corrección es condicional y mobile-first', () => {
  it.each(ROUTE_SECTIONS)(
    'la sección %i declara si hubo corrección o no la hubo',
    (index) => {
      // Sin defecto observado, "sin corrección" es el resultado válido; con
      // defecto, R6 exige la medición antes y después del mismo elemento.
      expect(actaSection(index)).toMatch(
        /Sin corrección \(R6\)|antes[\s\S]*despu[ée]s/,
      )
    },
  )

  it('no se declara ningún breakpoint personalizado', () => {
    const styles = read('src/styles.css')

    expect(styles).not.toMatch(/--breakpoint-/)
    expect(styles).not.toContain('@custom-media')
  })

  it('las superficies vivas no inventan variantes de ancho propias', () => {
    const arbitraryVariants = productionSources().flatMap((path) => [
      ...readFileSync(path, 'utf8').matchAll(/\b(?:min|max)-\[[^\]]+\]:/g),
    ])

    expect(arbitraryVariants).toEqual([])
  })
})

describe('ui-responsive-375 R9: el acta existe y está levantada', () => {
  it('declara los nueve encabezados exigidos, en orden', () => {
    const acta = readRepo(ACTA)
    const positions = ACTA_HEADINGS.map((heading) => acta.indexOf(heading))

    expect(positions.filter((position) => position < 0)).toEqual([])
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  // Las secciones 0 a 7 son las que se levantan midiendo en el navegador. La 8
  // es el veredicto humano: este test NO la da por buena, porque falsificarla
  // en verde es justo lo que R9 pide que no ocurra. Su gate es el reviewer, que
  // no aprueba el cierre aunque `pnpm test` esté verde.
  it.each([0, 1, 2, 3, 4, 5, 6, 7])(
    'la sección %i está levantada, no pendiente',
    (index) => {
      expect(actaSection(index)).not.toMatch(/\bPENDIENTE\b/)
    },
  )

  it('el plan cierra el punto sin verificar sin borrar el fallo histórico', () => {
    const plan = readRepo('progress/ui-redesign-plan.md')

    expect(plan).toContain('resize_window')
    expect(plan).toMatch(/seguía en 1864/)
    expect(plan).toContain('verify_ui-responsive-375.md')
  })
})

function surfaceTestFiles(directory = `${projectDir}/src/components`): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) return surfaceTestFiles(path)
    return entry.name.includes('.test.') ? [path] : []
  })
}

describe('ui-responsive-375 R10: no se edita ninguna aserción ajena', () => {
  // Toda la cobertura de esta feature vive en este archivo y en
  // e2e/responsive-375.spec.ts. Si un R-id suyo aparece dentro del test de una
  // superficie viva es que se tocó una aserción que no era suya.
  it.each(surfaceTestFiles().map((path) => relative(projectDir, path).replace(/\\/g, '/')))(
    '%s no contiene aserciones de esta feature',
    (path) => {
      expect(read(path)).not.toContain('ui-responsive-375')
    },
  )

  it('las cuatro aserciones en riesgo del plan siguen listadas y vivas', () => {
    const plan = readRepo('progress/ui-redesign-plan.md')

    expect(plan).toContain('flex-col.*sm:flex-row')
    expect(read('src/components/odc/executive-dashboard.test.tsx')).toContain(
      'toMatch(/focus-visible:ring/)',
    )
    expect(read('src/components/odc/monthly-summary.test.tsx')).toContain(
      "'odc-filter-results',",
    )
  })
})
