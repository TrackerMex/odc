import { test, expect } from '@playwright/test'

// Smoke test for browser-based UI validation (implementer/reviewer agents).
//
// Requires the full stack running, not just `pnpm dev`: /login resolves the
// session server-side in `loginBeforeLoad` (src/routes/login.tsx), which
// calls the backend directly via an absolute URL (src/lib/api.ts,
// resolveUrl). If the backend is unreachable, that fetch throws and the SSR
// render fails with a 500 — before the login form ever reaches the browser.
// Start the stack with `docker-compose up -d` (or backend + Postgres running
// locally) before running this test. See playwright.config.ts.
test('login page renders the login form', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByText('Ingresa a tu cuenta')).toBeVisible()
  await expect(page.getByTestId('login-form')).toBeVisible()
  await expect(page.getByLabel('Correo electrónico')).toBeVisible()
  await expect(page.getByLabel('Contraseña')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
})
