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
})
