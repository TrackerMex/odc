import { describe, expect, it } from 'vitest'
import {
  DEFAULT_API_PROXY_TARGET,
  createViteConfig,
  resolveApiProxyTarget,
} from './vite.config'

describe('R1: dev server proxies /api to the backend', () => {
  it('uses localhost:3001 by default for local development', () => {
    expect(resolveApiProxyTarget({})).toBe(DEFAULT_API_PROXY_TARGET)
  })

  it('uses API_PROXY_TARGET when the runtime provides a container target', () => {
    const target = 'http://backend:3001'

    expect(resolveApiProxyTarget({ API_PROXY_TARGET: target })).toBe(target)
  })

  it('defines a same-origin proxy using the resolved target', () => {
    const config = createViteConfig({ API_PROXY_TARGET: 'http://backend:3001' })
    const proxy = config.server?.proxy?.['/api']

    expect(proxy).toBeDefined()
    expect(proxy).toMatchObject({
      target: 'http://backend:3001',
      changeOrigin: true,
    })
  })
})
