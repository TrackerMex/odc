import { describe, expect, it } from 'vitest'
import { Route } from './__root'

const routeSources = import.meta.glob('./**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('R3: the document title is declared once in the root route', () => {
  it('emits the exact global title in the root head()', () => {
    const meta = Route.options.head?.({} as never).meta ?? []

    expect(meta).toContainEqual({ title: 'ODC — Órdenes de compra' })
  })

  it('leaves the title to the root route: no child route declares head()', () => {
    const childRoutes = Object.entries(routeSources).filter(
      ([path]) => !path.includes('__root') && !path.includes('.test.'),
    )

    expect(childRoutes.length).toBeGreaterThan(0)
    expect(
      childRoutes.filter(([, source]) => source.includes('head:')).map(
        ([path]) => path,
      ),
    ).toEqual([])
  })
})
