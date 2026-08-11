import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import {
  basename,
  dirname,
  extname,
  relative,
  resolve,
} from 'node:path'
import { describe, expect, it } from 'vitest'

const sourceDir = resolve(process.cwd(), 'src')
const routesDir = resolve(sourceDir, 'routes')
const odcComponentsDir = resolve(sourceDir, 'components/odc')
const sourceExtensions = ['.ts', '.tsx'] as const

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

function isProductionSource(path: string): boolean {
  const name = basename(path)
  return (
    !name.includes('.test.') &&
    !name.includes('.spec.') &&
    name !== 'routeTree.gen.ts'
  )
}

function localImportSpecifiers(source: string): string[] {
  const specifiers: string[] = []
  const staticImport =
    /(?:import|export)\s+(type\s+)?(?:[^'\"]*?\s+from\s*)?['\"]([^'\"]+)['\"]/g
  const dynamicImport = /import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)/g

  for (const match of source.matchAll(staticImport)) {
    if (!match[1]) specifiers.push(match[2])
  }
  for (const match of source.matchAll(dynamicImport)) {
    specifiers.push(match[1])
  }

  return specifiers.filter(
    (specifier) => specifier.startsWith('@/') || specifier.startsWith('.'),
  )
}

function resolveLocalImport(importer: string, specifier: string): string | null {
  const cleanSpecifier = specifier.split('?')[0]
  const unresolved = cleanSpecifier.startsWith('@/')
    ? resolve(sourceDir, cleanSpecifier.slice(2))
    : resolve(dirname(importer), cleanSpecifier)
  const candidates = extname(unresolved)
    ? [unresolved]
    : [
        ...sourceExtensions.map((extension) => `${unresolved}${extension}`),
        ...sourceExtensions.map((extension) =>
          resolve(unresolved, `index${extension}`),
        ),
      ]

  return (
    candidates.find(
      (candidate) =>
        existsSync(candidate) &&
        statSync(candidate).isFile() &&
        isProductionSource(candidate),
    ) ?? null
  )
}

function productionReachability(): Set<string> {
  const routeRoots = listFiles(routesDir).filter(
    (path) => path.endsWith('.tsx') && isProductionSource(path),
  )
  const reachable = new Set<string>()
  const pending = [...routeRoots]

  while (pending.length > 0) {
    const path = pending.pop()!
    if (reachable.has(path)) continue
    reachable.add(path)

    for (const specifier of localImportSpecifiers(readFileSync(path, 'utf8'))) {
      const importedPath = resolveLocalImport(path, specifier)
      if (importedPath && !reachable.has(importedPath)) pending.push(importedPath)
    }
  }

  return reachable
}

function unreachableOdcSurfaces(): string[] {
  const reachable = productionReachability()
  return listFiles(odcComponentsDir)
    .filter(
      (path) =>
        path.endsWith('.tsx') &&
        isProductionSource(path) &&
        !reachable.has(path),
    )
    .map((path) => basename(path))
    .sort()
}

describe('R1: superseded dashboards are absent from executable surfaces', () => {
  it('does not leave unreachable ODC component modules', () => {
    const unreachable = unreachableOdcSurfaces()
    expect(
      unreachable,
      `Unreachable ODC production surfaces:\n${unreachable.join('\n')}`,
    ).toEqual([])
  })
})

describe('R2: the authenticated home keeps the shared executive dashboard', () => {
  it('reaches one executive dashboard implementation from production routes', () => {
    const reachable = productionReachability()
    const executiveDashboard = resolve(
      odcComponentsDir,
      'executive-dashboard.tsx',
    )

    expect(reachable.has(executiveDashboard)).toBe(true)
  })
})

describe('R3: every ODC surface is transitively reachable from a route', () => {
  it('reports every orphan without counting tests or source-reading guards', () => {
    const unreachable = unreachableOdcSurfaces()
    expect(
      unreachable,
      `Unreachable ODC production surfaces:\n${unreachable.join('\n')}`,
    ).toEqual([])
  })
})

describe('R4: detail, form, login and monthly summary surfaces stay mounted', () => {
  it('keeps every planned surface reachable through production imports', () => {
    const reachable = productionReachability()
    const expectedSurfaces = [
      'components/login-form.tsx',
      'components/odc/admin-budget-actions.tsx',
      'components/odc/general-approval-actions.tsx',
      'components/odc/monthly-summary-slide.tsx',
      'components/odc/monthly-summary.tsx',
      'components/odc/odc-detail.tsx',
      'components/odc/odc-form.tsx',
      'components/odc/payment-evidence-form.tsx',
      'components/odc/register-payment-form.tsx',
      'components/odc/upload-invoice-form.tsx',
    ]
    const missing = expectedSurfaces.filter(
      (path) => !reachable.has(resolve(sourceDir, path)),
    )

    expect(
      missing,
      `Production routes do not reach:\n${missing.join('\n')}`,
    ).toEqual([])
  })
})

