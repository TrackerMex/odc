import { expect, test } from '@playwright/test'

const accounts = ['ops', 'admin', 'dg'] as const
const widths = [375, 768, 1024, 1440]

for (const account of accounts) {
  test(`executive-workspace-v2 R1,R14: ${account} shell and dashboard across themes and widths`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(180_000)
    const hydrationErrors: string[] = []
    page.on('pageerror', (error) => hydrationErrors.push(error.message))
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /hydrat|did not match/i.test(message.text())
      )
        hydrationErrors.push(message.text())
    })
    const signIn = await context.request.post('/api/auth/login', {
      data: {
        email: `${account}@odc.local`,
        password: process.env.SEED_PASSWORD ?? 'odc-dev-password',
      },
    })
    expect(signIn.ok()).toBe(true)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
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
        await page.reload()
        await page.waitForLoadState('networkidle')
        await expect(page.locator('#dashboard-title')).toBeVisible()
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
        await page.evaluate(() => window.scrollTo(0, 400))
        await expect(page.locator('.odc-app-shell > main > header')).toHaveCSS(
          'position',
          'sticky',
        )
        const fixedHeader = (await page
          .locator('.odc-app-shell > main > header')
          .boundingBox())!
        expect(fixedHeader.y).toBeGreaterThanOrEqual(0)
        expect(fixedHeader.y).toBeLessThanOrEqual(1)
        await page.evaluate(() => window.scrollTo(0, 0))
        const panel = page.getByRole('region', { name: 'Pulso operativo' })
        const priority = page.getByRole('region', {
          name: 'Prioridad inmediata',
          exact: true,
        })
        await expect(panel).toBeVisible()
        await expect(priority).toBeVisible()
        const chartTextSizes = await page.locator('svg[role="img"] text').evaluateAll(
          (labels) => labels.map((label) => {
            const text = label as SVGTextElement
            return Number.parseFloat(getComputedStyle(text).fontSize) * text.getScreenCTM()!.a
          }),
        )
        expect(Math.min(...chartTextSizes)).toBeGreaterThanOrEqual(12)
        expect((await panel.boundingBox())!.y).toBeLessThan(
          (await priority.boundingBox())!.y,
        )
        await expect(page.getByRole('link', { name: 'Crear ODC' })).toHaveCount(
          account === 'ops' ? 1 : 0,
        )
        const statusBounds = await page
          .getByRole('table', { name: 'Tareas prioritarias' })
          .locator('[data-status]')
          .evaluateAll((badges) =>
            badges.map((badge) => ({
              label: badge.textContent,
              right: badge.getBoundingClientRect().right,
              cellRight: badge.closest('td')!.getBoundingClientRect().right,
              height: badge.clientHeight,
              contentHeight: badge.scrollHeight,
            })),
          )
        for (const badge of statusBounds) {
          expect(
            badge.right,
            `${badge.label} stays in its cell`,
          ).toBeLessThanOrEqual(badge.cellRight)
          expect(
            badge.contentHeight,
            `${badge.label} is fully readable`,
          ).toBeLessThanOrEqual(badge.height + 1)
        }

        if (width === 375) {
          const toggle = page.getByRole('button', { name: /Cambiar a modo/ })
          const size = (await toggle.boundingBox())!
          expect(size.height).toBeGreaterThanOrEqual(44)
          expect(size.width).toBeGreaterThanOrEqual(44)
          const targets = await page
            .locator(
              '.odc-executive-dashboard a, .odc-executive-dashboard button, .odc-executive-dashboard input:not([aria-hidden="true"]):not([type="hidden"]), .odc-executive-dashboard summary',
            )
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
    expect(hydrationErrors).toEqual([])
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
