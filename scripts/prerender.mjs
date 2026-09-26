// Post-build prerender: renders the real app for the public, indexable routes and
// bakes the resulting markup + per-route <head> tags into static HTML, so crawlers
// that don't run JavaScript (AI crawlers, some link unfurlers) see actual content.
//
//   /         → dist/index.html   (also the SPA fallback for every other route)
//   /privacy  → dist/privacy.html (served at /privacy via a rewrite in vercel.json)
//
// How: load the built HTML into jsdom, load src/main.jsx through Vite's SSR module
// loader (so aliases, the React Compiler and env handling match the real build),
// let it render into #root with effects running (useDocumentMeta updates the head),
// then serialize. The browser still boots with createRoot, which replaces this
// markup with an identical render — it's there for first paint and for crawlers.
//
// The prerendered markup is only correct for first-time visitors on its own path,
// so an inline script right after #root removes it for anything else (another
// route served the index.html fallback, or a returning visitor with saved data on
// "/", who'd otherwise see the landing page flash before their timeline).

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ORIGIN = 'https://timeliner.app'
const STORAGE_KEY = 'timeliner_data' // keep in sync with STORAGE_KEY in src/utils/constants.js
const RENDER_SETTLE_MS = 1500

// Expected noise from running the app without IndexedDB or Supabase; anything
// else the app logs during prerender still gets through.
const EXPECTED_LOG_RE = /IndexedDB API missing|Supabase (env vars missing|offline)/

const ROUTES = [
  { path: '/', out: 'index.html' },
  { path: '/privacy', out: 'privacy.html' },
]

// Prerendering must not touch the real backend: without these the app runs in
// local-only mode (see src/lib/supabase.js).
delete process.env.VITE_SUPABASE_URL
delete process.env.VITE_SUPABASE_ANON_KEY

function removalScript(routePath) {
  const checkReturning = routePath === '/'
  return `<script>(function(){var el=document.querySelector('[data-prerender-path]');if(!el)return;var keep=location.pathname===${JSON.stringify(routePath)};${
    checkReturning ? `try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}))keep=false}catch(e){}` : ''
  }if(!keep)el.remove()})()</script>`
}

function filterExpectedLogs() {
  for (const level of ['log', 'warn', 'error']) {
    const original = console[level]
    console[level] = (...args) => {
      const text = args.map((a) => (a instanceof Error ? a.message : String(a))).join(' ')
      if (!EXPECTED_LOG_RE.test(text)) original(...args)
    }
  }
}

// The FAQPage entry in index.html's JSON-LD describes the landing page's visible
// FAQ. Other pages don't show it, so they must not carry that markup.
function stripFaqStructuredData(document) {
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    const data = JSON.parse(script.textContent)
    if (!Array.isArray(data['@graph'])) continue
    data['@graph'] = data['@graph'].filter((node) => node['@type'] !== 'FAQPage')
    script.textContent = `\n    ${JSON.stringify(data, null, 2).replace(/\n/g, '\n    ')}\n    `
  }
}

function installGlobals(window) {
  // Expose the jsdom window as the global environment the app modules expect.
  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in globalThis) continue
    try {
      globalThis[key] = window[key]
    } catch {
      // read-only globals — skip
    }
  }
  for (const key of ['window', 'self', 'document', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage']) {
    Object.defineProperty(globalThis, key, { value: window[key], configurable: true, writable: true })
  }
  globalThis.window = window

  // APIs jsdom doesn't implement (mirrors src/test/setup.js).
  const noopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  window.IntersectionObserver = globalThis.IntersectionObserver = noopObserver
  window.ResizeObserver = globalThis.ResizeObserver = noopObserver
  window.matchMedia = globalThis.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })
  window.scrollTo = globalThis.scrollTo = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
}

async function prerender(template, route) {
  const dom = new JSDOM(template, { url: `${ORIGIN}${route.path}`, pretendToBeVisual: true })
  const { document } = dom.window
  installGlobals(dom.window)

  const originalHead = new Set(document.head.children)
  const originalBody = new Set(document.body.children)

  const vite = await createServer({
    root,
    configFile: path.join(root, 'vite.config.js'),
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  })

  try {
    await vite.ssrLoadModule('/src/main.jsx')
    await new Promise((resolve) => setTimeout(resolve, RENDER_SETTLE_MS))

    const rootEl = document.getElementById('root')
    if (!rootEl || !rootEl.querySelector('h1')) {
      throw new Error(`prerender of ${route.path} produced no <h1>`)
    }

    // Drop anything the runtime injected outside #root (analytics script, toast
    // styles, portals) — the client adds its own when it boots.
    for (const el of [...document.head.children]) {
      if (!originalHead.has(el) && el.tagName !== 'META' && el.tagName !== 'TITLE') el.remove()
    }
    for (const el of [...document.body.children]) {
      if (!originalBody.has(el)) el.remove()
    }
    if (route.path !== '/') stripFaqStructuredData(document)
    document.documentElement.removeAttribute('style')
    document.documentElement.classList.remove('dark')
    if (!document.documentElement.getAttribute('class')) document.documentElement.removeAttribute('class')

    const wrapper = document.createElement('div')
    wrapper.setAttribute('data-prerender-path', route.path)
    wrapper.innerHTML = rootEl.innerHTML
    const html = dom.serialize()
    const rootMarkup = `<div id="root">${wrapper.outerHTML}</div>${removalScript(route.path)}`
    const serializedRoot = rootEl.outerHTML
    if (!html.includes(serializedRoot)) throw new Error('could not locate #root in serialized HTML')
    return html.replace(serializedRoot, rootMarkup)
  } finally {
    await vite.close()
    dom.window.close()
  }
}

filterExpectedLogs()
const template = await readFile(path.join(dist, 'index.html'), 'utf8')
for (const route of ROUTES) {
  const html = await prerender(template, route)
  await writeFile(path.join(dist, route.out), html)
  console.log(`prerendered ${route.path} → dist/${route.out} (${Math.round(html.length / 1024)} KB)`)
}
// Timers started by the rendered app (typewriter demo, counters) would keep Node alive.
process.exit(0)
