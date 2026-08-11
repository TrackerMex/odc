import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Auditoría estática de la hoja de estilos: los tokens de diseño son valores
// estáticos, así que se verifican leyendo `styles.css` en vez de arrancar un
// navegador (ver specs/ui-design-tokens/design.md).

const srcDir = `${resolve(process.cwd(), 'src')}/`
const css = readFileSync(`${srcDir}styles.css`, 'utf8')

function ruleBody(selector: string): string {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`selector no encontrado: ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

function declarations(selector: string): Record<string, string> {
  const out: Record<string, string> = {}
  const body = ruleBody(selector).replace(/\/\*[\s\S]*?\*\//g, '')
  for (const chunk of body.split(';')) {
    const match = /^\s*(--[\w-]+)\s*:\s*(.+)$/s.exec(chunk)
    if (match) out[match[1]] = match[2].trim()
  }
  return out
}

const root = declarations(':root')
const dark = declarations('.dark')
const theme = declarations('@theme inline')

const STATUSES = [
  'draft',
  'pending',
  'budget',
  'approved',
  'paid',
  'evidence',
  'done',
  'rejected',
] as const

// Los propios tests mencionan el paquete de la fuente, así que se excluyen:
// si no, la auditoría se encontraría a sí misma.
function srcFiles(): Array<string> {
  return readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .filter((entry) => /\.(tsx?|css)$/.test(entry) && !/\.test\./.test(entry))
    .map((entry) => `${srcDir}${entry}`)
}

// --- conversión oklch -> sRGB lineal -> contraste WCAG 2.1 (sin dependencias,
// exigido por R15) ---

type Rgb = [number, number, number]

function parseOklch(value: string): [number, number, number] {
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(value)
  if (!match) throw new Error(`no es un color oklch: ${value}`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function oklchToLinearRgb(value: string): Rgb {
  const [L, C, H] = parseOklch(value)
  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.min(1, Math.max(0, channel))) as Rgb
}

const encodeSrgb = (v: number) =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055
const decodeSrgb = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4

const relativeLuminance = ([r, g, b]: Rgb) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b

function contrastRatio(foreground: Rgb, background: Rgb): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const [lighter, darker] = a > b ? [a, b] : [b, a]
  return (lighter + 0.05) / (darker + 0.05)
}

// Los navegadores componen alpha en sRGB codificado, no en lineal.
function compositeOver(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  return foreground.map((channel, index) =>
    decodeSrgb(
      encodeSrgb(channel) * alpha + encodeSrgb(background[index]) * (1 - alpha),
    ),
  ) as Rgb
}

const themes = {
  light: root,
  dark: { ...root, ...dark },
}

describe('R1: Inter Variable cargada y --font-sans declarada', () => {
  it('importa @fontsource-variable/inter con un import estático en frontend/src', () => {
    const importers = srcFiles().filter((file) =>
      readFileSync(file, 'utf8').includes('@fontsource-variable/inter'),
    )
    expect(importers.length).toBeGreaterThan(0)
  })

  it('declara --font-sans en @theme inline con Inter Variable como primera familia', () => {
    expect(theme['--font-sans']).toBeDefined()
    expect(theme['--font-sans'].split(',')[0].trim()).toBe("'Inter Variable'")
  })

  it('no importa ninguna otra familia tipográfica', () => {
    const fontImports = srcFiles().flatMap((file) => [
      ...readFileSync(file, 'utf8').matchAll(/@fontsource[\w-]*\/([\w-]+)/g),
    ])
    expect(fontImports.length).toBeGreaterThan(0)
    expect([...new Set(fontImports.map((match) => match[1]))]).toEqual(['inter'])
  })
})

describe('R2: paleta navy del MASTER §1 en :root', () => {
  const MASTER = {
    '--background': 'oklch(0.9842 0.0034 247.86)',
    '--card': 'oklch(1 0 0)',
    '--foreground': 'oklch(0.2077 0.0398 265.75)',
    '--primary': 'oklch(0.3462 0.0736 256.04)',
    '--primary-foreground': 'oklch(0.985 0 0)',
    '--secondary': 'oklch(0.9632 0.0034 247.86)',
    '--muted-foreground': 'oklch(0.5544 0.0407 257.42)',
    '--border': 'oklch(0.9268 0.0063 255.48)',
    '--destructive': 'oklch(0.5771 0.2152 27.33)',
    '--ring': 'oklch(0.3462 0.0736 256.04)',
    '--accent-action': 'oklch(0.5960 0.1274 163.23)',
  }

  it.each(Object.entries(MASTER))('%s vale %s', (token, value) => {
    expect(root[token]).toBe(value)
  })

  it('--background y --card son distintos', () => {
    expect(root['--background']).not.toBe(root['--card'])
  })

  // Desviación documentada: R2 pide --accent-action-foreground:
  // oklch(0.985 0 0), pero blanco sobre el verde #059669 del MASTER da 3.61:1
  // y R5 exige >= 4.5:1. --accent-action-foreground no aparece en el MASTER §1,
  // así que se conserva el verde exacto y se oscurece el texto.
  // Ver progress/impl_ui-design-tokens.md.
  it('--accent-action-foreground usa el foreground del sistema (conflicto R2/R5)', () => {
    expect(root['--accent-action-foreground']).toBe(root['--foreground'])
  })
})

describe('R3: dark conserva roles, corrige --sidebar-primary y acota el chroma', () => {
  it('.dark redeclara todos los tokens semánticos de R2', () => {
    const semantic = [
      '--background',
      '--card',
      '--foreground',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--muted-foreground',
      '--border',
      '--destructive',
      '--ring',
      '--accent-action',
      '--accent-action-foreground',
    ]
    expect(semantic.filter((token) => dark[token] === undefined)).toEqual([])
  })

  it('.dark --sidebar-primary es el mismo valor que .dark --primary', () => {
    expect(dark['--sidebar-primary']).toBe(dark['--primary'])
  })

  it('elimina el violeta huérfano oklch(0.488 0.243 264.376)', () => {
    expect(css).not.toContain('oklch(0.488 0.243 264.376)')
  })

  it.each([
    [':root', root],
    ['.dark', dark],
  ])(
    'ningún token de %s fuera de status/destructive/accent-action pasa de chroma 0.10',
    (_selector, tokens) => {
      const exempt = /^--(status-|destructive|accent-action)/
      const offenders = Object.entries(tokens)
        .filter(([token]) => !exempt.test(token))
        .filter(([, value]) => value.startsWith('oklch('))
        .filter(([, value]) => parseOklch(value)[1] > 0.1)
      expect(offenders).toEqual([])
    },
  )
})

describe('R4: 8 pares --status-* / --status-*-surface en light y dark', () => {
  const LIGHT_FOREGROUNDS = {
    draft: 'oklch(0.4455 0.0374 257.28)',
    pending: 'oklch(0.5553 0.1455 49.00)',
    budget: 'oklch(0.5000 0.1193 242.75)',
    approved: 'oklch(0.5461 0.2152 262.88)',
    paid: 'oklch(0.4907 0.2412 292.58)',
    evidence: 'oklch(0.5198 0.0936 223.13)',
    done: 'oklch(0.5081 0.1049 165.61)',
    rejected: 'oklch(0.5771 0.2152 27.33)',
  }

  it('declara las 32 variables de estado', () => {
    const missing: Array<string> = []
    for (const [name, tokens] of [
      [':root', root],
      ['.dark', dark],
    ] as const) {
      for (const status of STATUSES) {
        for (const suffix of ['', '-surface']) {
          const token = `--status-${status}${suffix}`
          if (tokens[token] === undefined) missing.push(`${name} ${token}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it.each(Object.entries(LIGHT_FOREGROUNDS))(
    '--status-%s vale %s en tema claro',
    (status, value) => {
      expect(root[`--status-${status}`]).toBe(value)
    },
  )

  it('@theme inline expone los 16 tokens de estado como colores', () => {
    const missing = STATUSES.flatMap((status) =>
      ['', '-surface']
        .map((suffix) => `--color-status-${status}${suffix}`)
        .filter((token) => theme[token] === undefined),
    )
    expect(missing).toEqual([])
  })
})

describe('R5: contraste WCAG 2.1 >= 4.5:1 en los pares auditados', () => {
  const pairs = (['light', 'dark'] as const).flatMap((themeName) => {
    const tokens = themes[themeName]
    return [
      ...STATUSES.map(
        (status) =>
          [
            `${themeName} --status-${status} sobre su surface`,
            tokens[`--status-${status}`],
            tokens[`--status-${status}-surface`],
          ] as const,
      ),
      [
        `${themeName} --foreground sobre --background`,
        tokens['--foreground'],
        tokens['--background'],
      ] as const,
      [
        `${themeName} --foreground sobre --card`,
        tokens['--foreground'],
        tokens['--card'],
      ] as const,
      [
        `${themeName} --muted-foreground sobre --card`,
        tokens['--muted-foreground'],
        tokens['--card'],
      ] as const,
      [
        `${themeName} --primary-foreground sobre --primary`,
        tokens['--primary-foreground'],
        tokens['--primary'],
      ] as const,
      [
        `${themeName} --accent-action-foreground sobre --accent-action`,
        tokens['--accent-action-foreground'],
        tokens['--accent-action'],
      ] as const,
    ]
  })

  it.each(pairs)('%s', (_label, foreground, background) => {
    expect(foreground).toBeDefined()
    expect(background).toBeDefined()
    expect(
      contrastRatio(oklchToLinearRgb(foreground), oklchToLinearRgb(background)),
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('dark --destructive sobre --destructive/10 compuesto sobre --card', () => {
    const destructive = oklchToLinearRgb(themes.dark['--destructive'])
    const surface = compositeOver(
      destructive,
      oklchToLinearRgb(themes.dark['--card']),
      0.1,
    )
    expect(contrastRatio(destructive, surface)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('R6: radios y escala de espaciado', () => {
  it('declara los tres radios del MASTER §4', () => {
    expect(root['--radius']).toBe('0.375rem')
    expect(css).toContain('--radius-card: 0.625rem')
    expect(css).toContain('--radius-badge: 0.25rem')
  })

  it('@theme inline expone --radius-card y --radius-badge', () => {
    expect(theme['--radius-card']).toBeDefined()
    expect(theme['--radius-badge']).toBeDefined()
  })

  it.each([
    ['--space-xs', '0.125rem'],
    ['--space-sm', '0.25rem'],
    ['--space-md', '0.5rem'],
    ['--space-lg', '0.75rem'],
    ['--space-xl', '1rem'],
    ['--space-2xl', '1.5rem'],
    ['--space-3xl', '2rem'],
  ])('declara %s: %s', (token, value) => {
    expect(root[token]).toBe(value)
  })
})

describe('R14: prefers-reduced-motion respetado y transiciones de 150-300ms', () => {
  const REDUCED = '@media (prefers-reduced-motion: reduce)'

  it('toda regla con animation: aparece en el bloque de reduced-motion', () => {
    const cut = css.indexOf(REDUCED)
    expect(cut).toBeGreaterThan(-1)
    const reducedBlock = css.slice(cut)
    const selectors = [
      ...css
        .slice(0, cut)
        .matchAll(/([^{}]+)\{[^{}]*?\banimation:[^{}]*?\}/g),
    ].flatMap((match) => match[1].split(',').map((part) => part.trim()))
    expect(selectors.length).toBeGreaterThan(0)
    expect(
      selectors.filter((selector) => !reducedBlock.includes(selector)),
    ).toEqual([])
  })

  // Heurística por línea: en estos archivos cada cadena de clases ocupa una
  // línea, así que una `duration-*` en la misma línea que una `transition-*`
  // es la duración de esa transición.
  it.each([
    'button',
    'badge',
    'card',
    'input',
    'select',
    'textarea',
    'table',
    'field',
    'dialog',
  ])('%s.tsx no tiene transiciones fuera de 150-300ms', (primitive) => {
    const source = readFileSync(
      `${srcDir}components/ui/${primitive}.tsx`,
      'utf8',
    )
    const offenders = source
      .split('\n')
      .filter((line) => line.includes('transition-'))
      .flatMap((line) => [...line.matchAll(/\bduration-(\d+)\b/g)])
      .map((match) => Number(match[1]))
      .filter((duration) => duration < 150 || duration > 300)
    expect(offenders).toEqual([])
  })
})
