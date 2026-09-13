import { expect, test } from '@playwright/test'

const items = Array.from({ length: 10 }, (_, index) => ({
  id: `fixture-${index}`,
  odcNumber: `ODC-TEST-${index}`,
  status: 'PENDIENTE_ADMIN',
  description: 'Datos aislados de prueba',
  supplier: 'ACME',
  totalCents: 12345,
  createdAt: '2026-01-15T12:00:00Z',
  ageDays: 1,
  nextAction: 'VALIDAR_PRESUPUESTO',
}))

test('executive-workspace-v2 R3,R4,R13: retries exactly the failed page and restores URL state', async ({
  page,
  context,
}) => {
  test.setTimeout(90000)
  const login = await context.request.post('/api/auth/login', {
    data: {
      email: 'admin@odc.local',
      password: process.env.SEED_PASSWORD ?? 'odc-dev-password',
    },
  })
  expect(login.ok()).toBe(true)
  await page.goto('/tasks?month=all')
  await page.waitForLoadState('networkidle')
  await expect(
    page.getByRole('heading', { name: 'Mis tareas', exact: true }),
  ).toBeVisible()
  const requests: string[] = []
  let failed = false
  await page.route('**/api/odcs/executive-dashboard/tasks?*', async (route) => {
    const url = new URL(route.request().url())
    requests.push(url.search)
    if (url.searchParams.get('page') === '2' && !failed) {
      failed = true
      await route.fulfill({
        status: 503,
        json: { message: 'Temporary test failure' },
      })
      return
    }
    const currentPage = Number(url.searchParams.get('page') ?? 1)
    await route.fulfill({
      json: {
        month: url.searchParams.get('month'),
        page: currentPage,
        pageSize: 10,
        total: 25,
        items: items.map((item) => ({
          ...item,
          odcNumber: `PAGE-${currentPage}-${item.odcNumber}`,
        })),
      },
    })
  })
  await page.getByLabel('Mes de creación', { exact: true }).fill('2026-01')
  await expect(page.getByText('Página 1 de 3', { exact: true })).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Buscar por folio o proveedor' })
    .fill('ACME')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page).toHaveURL(/q=ACME/)
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/page=2/)
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
  await expect(page.getByText('Página 2 de 3', { exact: true })).toBeVisible()
  const retried = requests.filter(
    (query) => new URLSearchParams(query).get('page') === '2',
  )
  expect(retried).toHaveLength(2)
  expect(retried[0]).toBe(retried[1])
  expect(new URLSearchParams(retried[1]).get('month')).toBe('2026-01')
  expect(new URLSearchParams(retried[1]).get('q')).toBe('ACME')
  await page.goBack()
  await expect(page.getByText('Página 1 de 3', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Buscar por folio o proveedor' }),
  ).toHaveValue('ACME')
  await page.goForward()
  await expect(page.getByText('Página 2 de 3', { exact: true })).toBeVisible()

  let releaseLateResponse!: () => void
  const responseGate = new Promise<void>((resolve) => {
    releaseLateResponse = resolve
  })
  await page.route('**/api/odcs/executive-dashboard/tasks?*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('page') !== '3')
      return route.fallback()
    await responseGate
    return route.fulfill({
      json: {
        month: '2026-01',
        page: 3,
        pageSize: 10,
        total: 25,
        items: items.slice(0, 5),
      },
    })
  })
  const requested = page.waitForRequest(
    (request) => new URL(request.url()).searchParams.get('page') === '3',
  )
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
  await requested
  await page.goBack()
  await expect(page).not.toHaveURL(/page=3/)
  const currentPage = new URL(page.url()).searchParams.get('page') ?? '1'
  await expect(
    page.getByText(`Página ${currentPage} de 3`, { exact: true }),
  ).toBeVisible()
  const delivered = page.waitForResponse(
    (response) => new URL(response.url()).searchParams.get('page') === '3',
  )
  releaseLateResponse()
  await delivered
  await expect(
    page.getByText(`Página ${currentPage} de 3`, { exact: true }),
  ).toBeVisible()
  await expect(page).not.toHaveURL(/page=3/)
})

test('executive-workspace-v2 R1,R11,R12,R14: reviews accessibly and retries only the saved order', async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(120_000)
  const login = await context.request.post('/api/auth/login', {
    data: {
      email: 'ops@odc.local',
      password: process.env.SEED_PASSWORD ?? 'odc-dev-password',
    },
  })
  expect(login.ok()).toBe(true)
  const writes: string[] = []
  const submittedIds: string[] = []
  let savedPayload: Record<string, unknown> = {}
  let releaseSave!: () => void
  const saveGate = new Promise<void>((resolve) => {
    releaseSave = resolve
  })
  const draft = {
    id: 'browser-review-fixture',
    odcNumber: 'ODC-TEST-REVIEW-001',
    status: 'BORRADOR',
    createdAt: '2026-09-13T12:00:00.000Z',
    updatedAt: '2026-09-13T12:00:00.000Z',
    history: [],
    totalCents: 44970,
  }
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    if (request.method() === 'GET') return route.continue()
    const path = new URL(request.url()).pathname
    writes.push(`${request.method()} ${path}`)
    if (request.method() === 'POST' && path === '/api/odcs') {
      savedPayload = request.postDataJSON()
      await saveGate
      return route.fulfill({ status: 201, json: { ...savedPayload, ...draft } })
    }
    if (
      request.method() === 'POST' &&
      path === `/api/odcs/${draft.id}/submit`
    ) {
      submittedIds.push(draft.id)
      return submittedIds.length === 1
        ? route.fulfill({
            status: 400,
            json: { message: 'Isolated submit failure' },
          })
        : route.fulfill({
            json: { ...savedPayload, ...draft, status: 'PENDIENTE_ADMIN' },
          })
    }
    return route.abort('blockedbyclient')
  })

  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['light', 'dark']) {
      await page.goto('/odcs/new')
      await page.waitForLoadState('networkidle')
      const isDark = await page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark'))
      if (isDark !== (theme === 'dark'))
        await page.getByRole('button', { name: /Cambiar a modo/ }).click()
      await expect(page.locator('html')).toHaveCSS('color-scheme', theme)
      const send = page.getByRole('button', {
        name: 'Enviar a Administración',
        exact: true,
      })
      await send.click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(
        page.getByLabel('Descripción *', { exact: true }),
      ).toBeFocused()
      await page
        .getByLabel('Descripción *', { exact: true })
        .fill('  Sensores GPS  ')
      await page.getByLabel('Cantidad *', { exact: true }).fill('3')
      await page.getByLabel('Unidad *', { exact: true }).fill('pieza')
      await page
        .getByLabel('Precio unitario (MXN) *', { exact: true })
        .fill('149.90')
      await page
        .getByRole('combobox', { name: 'Proveedor', exact: true })
        .click()
      const supplier = page.getByRole('option').first()
      const supplierName = (await supplier.innerText()).trim()
      await supplier.click()
      await expect(page.getByRole('listbox')).toHaveCount(0)
      await page.getByRole('button', { name: 'Añadir comentarios' }).click()
      await expect(
        page.getByRole('button', { name: 'Ocultar comentarios' }),
      ).toBeVisible()
      await page
        .getByLabel('Comentarios', { exact: true })
        .fill('Entrega urgente para instalación de sensores GPS.')
      await page.evaluate(() => window.scrollTo(0, 400))
      const header = page.locator('.odc-app-shell > main > header')
      await expect(header).toHaveCSS('position', 'sticky')
      const headerBounds = (await header.boundingBox())!
      expect(headerBounds.y).toBeGreaterThanOrEqual(0)
      expect(headerBounds.y).toBeLessThanOrEqual(1)
      if (width === 1440) {
        const summary = (await page.getByRole('complementary').boundingBox())!
        expect(summary.y).toBeGreaterThanOrEqual(headerBounds.height + 16)
      }
      await send.click()
      const review = page.getByRole('dialog', {
        name: 'Revisar orden de compra',
      })
      await expect(review).toBeVisible()
      await expect(
        review.getByText('Sensores GPS', { exact: true }),
      ).toBeVisible()
      await expect(
        review.getByText(supplierName, { exact: true }),
      ).toBeVisible()
      await expect(review.getByText('$449.70', { exact: true })).toBeVisible()
      expect(writes).toEqual([])
      const dimensions = await review.evaluate((dialog) => ({
        x: dialog.getBoundingClientRect().x,
        right: dialog.getBoundingClientRect().right,
        height: dialog.getBoundingClientRect().height,
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        buttons: Array.from(dialog.querySelectorAll('button')).map(
          (button) => button.getBoundingClientRect().height,
        ),
      }))
      expect(dimensions.x).toBeGreaterThanOrEqual(0)
      expect(dimensions.right).toBeLessThanOrEqual(width)
      expect(dimensions.height).toBeLessThanOrEqual(900)
      expect(dimensions.pageOverflow).toBe(false)
      for (const height of dimensions.buttons)
        expect(height).toBeGreaterThanOrEqual(44)
      await page.screenshot({
        path: testInfo.outputPath(`review-${width}-${theme}.png`),
      })
      await page.keyboard.press('Escape')
      await expect(review).toHaveCount(0)
      await expect(send).toBeFocused()
      await send.click()
      await review.getByRole('button', { name: 'Volver a editar' }).click()
      await expect(review).toHaveCount(0)
      await expect(send).toBeFocused()
      await expect(
        page.getByLabel('Descripción *', { exact: true }),
      ).toHaveValue('  Sensores GPS  ')
    }
  }

  await page
    .getByRole('button', { name: 'Enviar a Administración', exact: true })
    .click()
  const confirm = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar envío a Administración' })
  const bounds = (await confirm.boundingBox())!
  await page.mouse.dblclick(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  )
  await expect.poll(() => writes.length).toBe(1)
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Procesando…' }),
  ).toBeDisabled()
  expect(savedPayload).toMatchObject({
    description: 'Sensores GPS',
    quantity: 3,
    unit: 'pieza',
    unitPriceCents: 14990,
  })
  releaseSave()
  const retry = page.getByRole('button', { name: 'Reintentar envío' })
  await expect(retry).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(
    `La orden ${draft.odcNumber} quedó guardada como borrador`,
  )
  await expect(page.getByLabel('Descripción *', { exact: true })).toBeDisabled()
  await retry.click()
  await expect(
    page.getByRole('status').filter({ hasText: draft.odcNumber }),
  ).toHaveText(`Orden ${draft.odcNumber} · Pendiente de Administración`)
  await expect(
    page.getByRole('button', { name: 'Ver detalle', exact: true }),
  ).toBeVisible()
  expect(submittedIds).toEqual([draft.id, draft.id])
  expect(writes).toEqual([
    'POST /api/odcs',
    `POST /api/odcs/${draft.id}/submit`,
    `POST /api/odcs/${draft.id}/submit`,
  ])
})
