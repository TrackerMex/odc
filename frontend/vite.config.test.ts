import { describe, expect, it } from 'vitest'
import config from './vite.config'

describe('R1: dev server proxies /api to the backend', () => {
  it('defines a same-origin proxy for /api to http://localhost:3001', () => {
    const proxy = config.server?.proxy?.['/api']
    expect(proxy).toBeDefined()
    expect(proxy).toMatchObject({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  })
})
