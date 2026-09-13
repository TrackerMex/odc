import { expect, test } from '@playwright/test'

const accounts = ['ops', 'admin', 'dg'] as const
const widths = [375, 768, 1024, 1440]

for (const account of accounts) {
  test(`frontend-dashboard-template R1,R2,R7: ${account} shell and dashboard across themes and widths`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(120_000)
    const signIn = await context.request.post('/api/auth/login', {
      data: {
        email: `${account}@odc.local`,
        password: process.env.SEED_PASSWORD ?? 'odc-dev-password',
      },
    })
    expect(signIn.ok()).toBe(true)
    await page.goto('/')
    await expect(page.locator('#dashboard-title')).toBeVisible()

    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 })
      for (const theme of ['light', 'dark']) {
        const isDark = await page
          .locator('html')
          .evaluate((element) => element.classList.contains('dark'))
        if (isDark !== (theme === 'dark'))
          await page.getByRole('button', { name: /Cambiar a modo/ }).click()
        await expect(page.locator('html')).toHaveCSS('color-scheme', theme)
        const measurements = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          header: document
            .querySelector('.odc-app-shell header')!
            .getBoundingClientRect().height,
        }))
        expect(measurements.width).toBe(width)
        expect(measurements.scroll).toBeLessThanOrEqual(measurements.client + 1)
        expect(measurements.header).toBe(width < 768 ? 58 : 64)
        const panel = page.getByRole('region', { name: 'Pulso operativo' })
        const priority = page.getByRole('region', {
          name: 'Prioridad inmediata',
          exact: true,
        })
        expect((await panel.boundingBox())!.y).toBeLessThan(
          (await priority.boundingBox())!.y,
        )
        await expect(page.getByRole('link', { name: 'Crear ODC' })).toHaveCount(
          account === 'ops' ? 1 : 0,
        )

        if (width === 375) {
          const toggle = page.getByRole('button', { name: /Cambiar a modo/ })
          const size = (await toggle.boundingBox())!
          expect(size.height).toBeGreaterThanOrEqual(44)
          expect(size.width).toBeGreaterThanOrEqual(44)
          const targets = await page
            .locator('.odc-executive-dashboard a')
            .evaluateAll((elements) =>
              elements.map((element) => ({
                name: element.textContent,
                width: element.getBoundingClientRect().width,
                height: element.getBoundingClientRect().height,
              })),
            )
          for (const target of targets) {
            expect(
              target.height,
              `${target.name} touch height`,
            ).toBeGreaterThanOrEqual(44)
            expect(
              target.width,
              `${target.name} touch width`,
            ).toBeGreaterThanOrEqual(44)
          }
          const menu = page.getByRole('button', {
            name: 'Alternar navegación',
            exact: true,
          })
          await expect(menu).toHaveAttribute('aria-expanded', 'false', {
            timeout: 30_000,
          })
          await menu.focus()
          await page.keyboard.press('Enter')
          const sheet = page.locator('[data-mobile="true"]')
          await expect(sheet).toBeVisible()
          await expect(
            sheet.getByRole('link', { name: 'Mis tareas' }),
          ).toBeVisible()
          await expect(
            sheet.getByRole('link', { name: 'Nueva orden' }),
          ).toHaveCount(account === 'ops' ? 1 : 0)
          await page.getByRole('button', { name: 'Cerrar navegación' }).click()
          await expect(sheet).not.toBeVisible()
        }
        await page.screenshot({
          path: testInfo.outputPath(`${account}-${width}-${theme}.png`),
          fullPage: true,
        })
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(
      page.locator('.odc-app-shell [data-slot="sidebar-container"]'),
    ).toHaveCSS('transition-duration', '0s')
    await page.setViewportSize({ width: 375, height: 1000 })
    const mobileMenu = page.getByRole('button', {
      name: 'Alternar navegación',
      exact: true,
    })
    await expect(mobileMenu).toHaveAttribute('aria-expanded', 'false')
    await mobileMenu.press('Enter')
    await expect(page.locator('[data-mobile="true"]')).toHaveCSS(
      'transition-duration',
      '0s',
    )
    await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCSS(
      'transition-duration',
      '0s',
    )
  })
}
