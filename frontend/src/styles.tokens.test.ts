import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Auditoría estática de la hoja de estilos: los tokens de diseño son valores
// estáticos, así que se verifican leyendo `styles.css` en vez de arrancar un
// navegador (ver specs/ui-design-tokens/design.md).

const srcDir = `${resolve(process.cwd(), 'src')}/`
// vitest corre con cwd en frontend/; R9 y R10 auditan artefactos del harness.
const repoRoot = `${resolve(process.cwd(), '..')}/`
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

// Sin recortar: un canal fuera de [0,1] significa que el color declarado no
// existe en sRGB y que el navegador pinta otro (gamut mapping de CSS Color 4).
function oklchToRawLinearRgb(value: string): Rgb {
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
  ] as Rgb
}

function oklchToLinearRgb(value: string): Rgb {
  return oklchToRawLinearRgb(value).map((channel) =>
    Math.min(1, Math.max(0, channel)),
  ) as Rgb
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
    expect([...new Set(fontImports.map((match) => match[1]))]).toEqual([
      'inter',
    ])
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
    // Enmienda firmada 2026-08-10: #059669 -> #047857 (emerald-700).
    '--accent-action': 'oklch(0.5081 0.1049 165.61)',
    '--accent-action-foreground': 'oklch(0.985 0 0)',
  }

  it.each(Object.entries(MASTER))('%s vale %s', (token, value) => {
    expect(root[token]).toBe(value)
  })

  it('--background y --card son distintos', () => {
    expect(root['--background']).not.toBe(root['--card'])
  })

  // La enmienda unifica el verde de confirmar con el del estado al que lleva.
  it('--accent-action es el mismo verde que --status-done en tema claro', () => {
    expect(root['--accent-action']).toBe(root['--status-done'])
  })
})

describe('R3: dark conserva roles y corrige --sidebar-primary', () => {
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

  // La cláusula de chroma plano <= 0.10 de este requisito queda sustituida por
  // la R1 de ui-dark-mode-chroma (feature 24), que la expresa sobre la
  // saturación s = C/L. Un techo plano de chroma se comporta distinto en light
  // y en dark porque el mismo token vive a lightness distinta: es la causa
  // mecánica del defecto D-V1. Ver la enmienda registrada en
  // specs/ui-design-tokens/requirements.md.
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

describe('ui-surfaces-detail-forms R3: contraste del banner destructivo', () => {
  it.each(['light', 'dark'] as const)(
    '%s --destructive sobre --destructive/3 compuesto sobre --card',
    (themeName) => {
      const destructive = oklchToLinearRgb(themes[themeName]['--destructive'])
      const surface = compositeOver(
        destructive,
        oklchToLinearRgb(themes[themeName]['--card']),
        0.03,
      )
      expect(contrastRatio(destructive, surface)).toBeGreaterThanOrEqual(4.5)
    },
  )
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
      ...css.slice(0, cut).matchAll(/([^{}]+)\{[^{}]*?\banimation:[^{}]*?\}/g),
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

// --- feature 24: ui-dark-mode-chroma ---
// El chroma oklch es absoluto; "cuánto color se percibe" a una lightness dada
// se aproxima con s = C / L. Es la métrica que hace medible el defecto D-V1:
// el primario de dark tenía el mismo chroma que el de light a el doble de
// lightness, y por eso se veía lavado sin que ningún test de contraste lo viera.
const saturation = (value: string) => {
  const [L, C] = parseOklch(value)
  return L > 0 ? C / L : 0
}

// Techo congelado por decisión humana (2026-08-11). Su origen es la saturación
// del navy institucional de :root --primary, 0.0736 / 0.3462 = 0.21259, pero se
// escribe como constante y NO se deriva del token en tiempo de test: un techo
// derivado es autorreferencial — eximiría al navy de su propio límite y subiría
// solo para todos los demás si alguien le subiera el chroma. Congelado, :root
// --primary queda sujeto a él con un margen de 0.00001.
const SATURATION_CEILING = 0.2126

const CEILING_EXEMPT = /^--(status-|destructive|accent-action)/

const oklchTokens = (tokens: Record<string, string>) =>
  Object.entries(tokens).filter(([, value]) => value.startsWith('oklch('))

const byTheme = [
  [':root', root],
  ['.dark', dark],
] as const

describe('ui-dark-mode-chroma R1: techo de saturación s = C/L congelado', () => {
  it.each(byTheme)(
    'ningún token de %s fuera de status/destructive/accent-action supera el techo',
    (_selector, tokens) => {
      const offenders = oklchTokens(tokens)
        .filter(([token]) => !CEILING_EXEMPT.test(token))
        .filter(([, value]) => saturation(value) > SATURATION_CEILING)
        .map(([token]) => token)
      expect(offenders).toEqual([])
    },
  )

  it(':root --primary está sujeto al techo como cualquier otro token', () => {
    expect(CEILING_EXEMPT.test('--primary')).toBe(false)
    expect(saturation(root['--primary'])).toBeLessThanOrEqual(
      SATURATION_CEILING,
    )
  })
})

describe('ui-dark-mode-chroma R2: suelo del 85% de saturación en dark', () => {
  // Solo estos dos: para los --status-* y --destructive el suelo es inalcanzable
  // dentro de sRGB a su lightness (tabla de gamut en design.md).
  it.each(['--primary', '--accent-action'])(
    '.dark %s conserva al menos el 85% de la saturación de :root',
    (token) => {
      expect(saturation(dark[token])).toBeGreaterThanOrEqual(
        0.85 * saturation(root[token]),
      )
    },
  )
})

describe('ui-dark-mode-chroma R3: --ring y los alias del sidebar siguen a --primary', () => {
  it.each(
    byTheme.flatMap(([selector, tokens]) =>
      ['--ring', '--sidebar-primary', '--sidebar-ring'].map(
        (token) => [selector, token, tokens] as const,
      ),
    ),
  )('%s %s vale lo mismo que su --primary', (_selector, token, tokens) => {
    expect(tokens[token]).toBe(tokens['--primary'])
  })
})

describe('ui-dark-mode-chroma R4: .dark --primary es una superficie clara', () => {
  // Inverted Ledger Rule: en dark el primario es superficie clara con texto
  // oscuro encima. Impide satisfacer R2 bajando la lightness, que sube s sin
  // añadir color y devolvería un navy invisible sobre el fondo.
  it.each(['--card', '--primary-foreground'])(
    'tiene más lightness que .dark %s',
    (token) => {
      expect(parseOklch(dark['--primary'])[0]).toBeGreaterThan(
        parseOklch(dark[token])[0],
      )
    },
  )
})

describe('ui-dark-mode-chroma R5: ningún token declarado fuera del gamut sRGB', () => {
  // El recorte por canal de la conversión enmascaraba el problema: para un token
  // fuera de gamut, el color que audita el test no es el que pinta el navegador.
  const GAMUT_TOLERANCE = 1e-4

  it.each(byTheme)(
    'los tres canales de cada oklch de %s caen en [0, 1]',
    (_selector, tokens) => {
      const offenders = oklchTokens(tokens)
        .filter(([, value]) =>
          oklchToRawLinearRgb(value).some(
            (channel) =>
              channel < -GAMUT_TOLERANCE || channel > 1 + GAMUT_TOLERANCE,
          ),
        )
        .map(([token]) => token)
      expect(offenders).toEqual([])
    },
  )
})

describe('ui-dark-mode-chroma R6: el primario de dark contrasta con sus fondos', () => {
  // Dos pares que la auditoría de la feature 23 no cubría: en dark el primario
  // es superficie, no texto, así que nadie medía si se despega del fondo.
  it.each(['--background', '--card'])(
    '.dark --primary sobre .dark %s alcanza 4.5:1',
    (token) => {
      expect(
        contrastRatio(
          oklchToLinearRgb(themes.dark['--primary']),
          oklchToLinearRgb(themes.dark[token]),
        ),
      ).toBeGreaterThanOrEqual(4.5)
    },
  )
})

describe('ui-dark-mode-chroma R7: el verde es un color en dos papeles', () => {
  // En light una sola lightness sirve para los dos papeles y los tokens son
  // idénticos. En dark difieren en lightness a propósito: --accent-action es
  // superficie de acción con texto oscuro encima, --status-done es texto de
  // badge sobre superficie oscura, a la lightness común de las 8 badges. Lo que
  // los mantiene siendo un verde y no dos es el hue compartido.
  it(':root --accent-action y :root --status-done son el mismo valor', () => {
    expect(root['--accent-action']).toBe(root['--status-done'])
  })

  it.each(['--accent-action', '--status-done'])(
    '.dark %s conserva el hue de su contraparte de :root',
    (token) => {
      expect(parseOklch(dark[token])[2]).toBe(parseOklch(root[token])[2])
    },
  )
})

describe('ui-dark-mode-chroma R8: los tests afirman invariantes, no literales nuevos', () => {
  // Todo literal oklch del propio archivo de test tiene que ser un valor
  // declarado hoy en :root — las aserciones heredadas de la feature 23, que se
  // conservan — o el violeta huérfano que R3 de la 23 exige que no exista.
  // Fijar un color en un test sin haberlo visto en pantalla es lo que produjo la
  // contradicción R2/R5 de la 23 y el propio D-V1.
  const ORPHAN_VIOLET = 'oklch(0.488 0.243 264.376)'

  it('no fija ningún literal oklch fuera de los valores de :root', () => {
    const source = readFileSync(`${srcDir}styles.tokens.test.ts`, 'utf8')
    const declared = new Set(Object.values(root))
    // Exige un dígito tras el paréntesis para no confundir con los
    // `startsWith('oklch(')` que filtran tokens por prefijo.
    const literals = [...new Set(source.match(/oklch\(\s*[\d.][^)]*\)/g) ?? [])]
    expect(literals.length).toBeGreaterThan(0)
    expect(
      literals.filter(
        (literal) => literal !== ORPHAN_VIOLET && !declared.has(literal),
      ),
    ).toEqual([])
  })
})

describe('ui-dark-mode-chroma R9: la verificación en navegador existe', () => {
  // El contenido lo juzga un humano; el test solo garantiza que el informe
  // existe y declara sus cuatro secciones. Un invariante verde puede seguir
  // viéndose mal: esa es la razón de que esta feature exista.
  it.each([
    '## 1. getComputedStyle en los dos temas',
    '## 2. CTA primario junto al outline en dark',
    '## 3. Las 8 badges de estado en dark',
    '## 4. Veredicto humano',
  ])('el informe declara la sección "%s"', (heading) => {
    expect(
      readFileSync(`${repoRoot}progress/verify_ui-dark-mode-chroma.md`, 'utf8'),
    ).toContain(heading)
  })
})

describe('ui-dark-mode-chroma R10: la enmienda queda registrada en la spec de la 23', () => {
  it('la tabla de enmiendas de ui-design-tokens nombra a ui-dark-mode-chroma', () => {
    const spec = readFileSync(
      `${repoRoot}specs/ui-design-tokens/requirements.md`,
      'utf8',
    )
    const marker = '## Enmiendas posteriores a la aprobación'
    expect(spec).toContain(marker)
    expect(spec.slice(spec.indexOf(marker))).toContain('ui-dark-mode-chroma')
  })
})

describe('ui-dark-mode-chroma R11: sin dependencias nuevas en frontend', () => {
  // Lista congelada. La conversión oklch -> sRGB de este archivo se amplía a
  // mano; añadir culori o colorjs.io para el gamut rompe aquí a propósito.
  const FROZEN_DEPENDENCIES = [
    '@base-ui/react',
    '@fontsource-variable/geist',
    '@fontsource-variable/inter',
    '@playwright/test',
    '@tailwindcss/typography',
    '@tailwindcss/vite',
    '@tanstack/devtools-vite',
    '@tanstack/eslint-config',
    '@tanstack/react-devtools',
    '@tanstack/react-form',
    '@tanstack/react-query',
    '@tanstack/react-router',
    '@tanstack/react-router-devtools',
    '@tanstack/react-router-ssr-query',
    '@tanstack/react-start',
    '@tanstack/router-cli',
    '@tanstack/router-plugin',
    '@testing-library/dom',
    '@testing-library/react',
    '@types/node',
    '@types/react',
    '@types/react-dom',
    '@vitejs/plugin-react',
    'class-variance-authority',
    'clsx',
    'date-fns',
    'eslint',
    'html-to-image',
    'jsdom',
    'jspdf',
    'lucide-react',
    'prettier',
    'react',
    'react-day-picker',
    'react-dom',
    'shadcn',
    'tailwind-merge',
    'tailwindcss',
    'tw-animate-css',
    'typescript',
    'vite',
    'vitest',
    'zod',
    'zustand',
  ]

  it('el manifiesto declara exactamente las dependencias congeladas', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    )
    expect(
      [
        ...Object.keys(manifest.dependencies),
        ...Object.keys(manifest.devDependencies),
      ].sort(),
    ).toEqual(FROZEN_DEPENDENCIES)
  })
})
