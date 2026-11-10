// The one inline script the site ships: it runs right after the prerendered
// #root and removes that markup when it doesn't fit the visitor (another
// route got the index.html fallback, or a returning visitor on "/" who'd
// otherwise see the landing page flash before their timeline).
//
// The CSP in vercel.json allows exactly these scripts by SHA-256 hash instead
// of 'unsafe-inline'. Changing the script text changes its hash: run
// `node scripts/prerenderGate.mjs` and paste the printed sources into the
// script-src of vercel.json. The build (scripts/prerender.mjs) and
// src/test/csp.test.js both fail until they match.

import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const STORAGE_KEY = 'timeliner_data' // keep in sync with STORAGE_KEY in src/utils/constants.js

export const PRERENDER_ROUTES = ['/', '/privacy']

/** The script body (without <script> tags) for a prerendered route. */
export function removalScriptBody(routePath) {
  const checkReturning = routePath === '/'
  return `(function(){var el=document.querySelector('[data-prerender-path]');if(!el)return;var keep=location.pathname===${JSON.stringify(routePath)};${
    checkReturning ? `try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}))keep=false}catch(e){}` : ''
  }if(!keep)el.remove()})()`
}

export function removalScript(routePath) {
  return `<script>${removalScriptBody(routePath)}</script>`
}

/** CSP source expression for a route's script, e.g. 'sha256-abc...='. */
export function cspHash(routePath) {
  const digest = createHash('sha256').update(removalScriptBody(routePath), 'utf8').digest('base64')
  return `'sha256-${digest}'`
}

/** Hashes from PRERENDER_ROUTES missing from a CSP string. */
export function missingCspHashes(csp) {
  return PRERENDER_ROUTES.map(cspHash).filter((hash) => !csp.includes(hash))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(PRERENDER_ROUTES.map(cspHash).join(' '))
}
