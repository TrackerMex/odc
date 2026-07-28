import { configDefaults, defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

// Separate from vite.config.ts on purpose: keeps the TanStack Start/devtools
// build plugins out of the test runner. Vitest picks this file up
// automatically instead of vite.config.ts when both are present.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ holds Playwright specs (run via `pnpm e2e`), not vitest tests —
    // exclude it so vitest's default *.spec.ts glob doesn't pick them up.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
