import { defineConfig } from 'vitest/config'
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
  },
})
