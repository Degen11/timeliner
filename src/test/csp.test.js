// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { removalScriptBody, cspHash, PRERENDER_ROUTES, missingCspHashes } from '../../scripts/prerenderGate.mjs'

const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'))
const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value
const scriptSrc = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src'))

describe('Content-Security-Policy', () => {
  it("doesn't allow arbitrary inline scripts", () => {
    expect(scriptSrc).not.toContain("'unsafe-inline'")
    expect(scriptSrc).not.toContain("'unsafe-eval'")
  })

  it('allows each prerender removal script by its exact hash', () => {
    expect(missingCspHashes(csp)).toEqual([])
    for (const route of PRERENDER_ROUTES) {
      const expected = createHash('sha256').update(removalScriptBody(route)).digest('base64')
      expect(cspHash(route)).toBe(`'sha256-${expected}'`)
      expect(scriptSrc).toContain(cspHash(route))
    }
  })

  it('API responses carry no unsafe-inline script-src either', () => {
    const src = readFileSync(new URL('../../api/rateLimit.js', import.meta.url), 'utf8')
    const apiCsp = src.match(/'Content-Security-Policy',\s*\n?\s*"([^"]+)"/)[1]
    expect(apiCsp).toMatch(/script-src 'self';/)
  })
})
