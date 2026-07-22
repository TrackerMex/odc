import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// jsdom doesn't implement matchMedia; the sidebar primitive (useIsMobile)
// needs it to exist to render at all in tests. Guarded because this setup
// file also runs for files that force `// @vitest-environment node` (no
// `window` global by design, e.g. api.ssr.test.ts).
if (typeof window !== 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
