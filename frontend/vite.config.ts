import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export const DEFAULT_API_PROXY_TARGET = 'http://localhost:3001'

export function resolveApiProxyTarget(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.API_PROXY_TARGET ?? DEFAULT_API_PROXY_TARGET
}

export function createViteConfig(env: NodeJS.ProcessEnv = process.env) {
  return defineConfig({
    resolve: { tsconfigPaths: true },
    plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
    server: {
      proxy: {
        '/api': {
          target: resolveApiProxyTarget(env),
          changeOrigin: true,
        },
      },
    },
  })
}

export default createViteConfig()
