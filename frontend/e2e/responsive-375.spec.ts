import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Gate de medición de `specs/ui-responsive-375` (R1).
//
// Antecedente: en la revisión del 2026-08-10 se pidió `resize_window` a 390px y
// `window.innerWidth` siguió devolviendo 1864. El instrumento falló en silencio.
// Por eso R1 prohíbe `resize_window` como método único y exige leer el viewport
// desde el propio navegador antes de dar por válida cualquier observación.
//
// Requiere el stack completo (`docker-compose up -d`): hasta /login resuelve la
// sesión en SSR contra el backend. Ver playwright.config.ts y e2e/login.spec.ts.
export const VIEWPORT_375 = { width: 375, height: 667 } as const

export interface ViewportGate {
  innerWidth: number
  clientWidth: number
  devicePixelRatio: number
  sm: boolean
  md: boolean
}

export async function readViewportGate(page: Page): Promise<ViewportGate> {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    devicePixelRatio: window.devicePixelRatio,
    sm: window.matchMedia('(min-width: 40rem)').matches,
    md: window.matchMedia('(min-width: 48rem)').matches,
  }))
}

// Las lecturas 4 y 5 son el gate real: `sm` y `md` son los prefijos de los que
// depende todo el layout, y un viewport de 375px que los deje encendidos
// significa que el instrumento mintió.
export function expectGateHolds(gate: ViewportGate): void {
  expect(gate.innerWidth).toBe(375)
  expect(gate.clientWidth).toBe(375)
  expect(gate.devicePixelRatio).toBeGreaterThan(0)
  expect(gate.sm).toBe(false)
  expect(gate.md).toBe(false)
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(VIEWPORT_375)
})

test.describe('ui-responsive-375 R1: el viewport medido es de verdad 375px', () => {
  test('registra las cinco lecturas y deja sm y md apagados', async ({
    page,
  }) => {
    await page.goto('/login')

    const gate = await readViewportGate(page)
    // eslint-disable-next-line no-console -- la salida es la cabecera del acta.
    console.log('R1 gate:', JSON.stringify(gate))

    expectGateHolds(gate)
  })
})
