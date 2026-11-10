/**
 * Web Worker for parsing large JSON/ICS/Markdown import files off the main
 * thread. It runs the same normalizers as the main-thread path
 * (utils/importHelpers), so both paths always produce identical events.
 * CSV goes through Papa on the main thread and never reaches this worker.
 *
 * Messages:
 *   { type: 'json' | 'ics' | 'markdown', data: string }
 *
 * Response:
 *   { events: Array, error?: string }
 */
import { normalizeJSONEvents, normalizeICSEvents, normalizeMarkdownEvents } from '@/utils/importHelpers'

export const WORKER_PARSERS = {
  json: (text) => normalizeJSONEvents(JSON.parse(text)),
  ics: normalizeICSEvents,
  markdown: normalizeMarkdownEvents,
}

export function parseImport(type, data) {
  const parse = WORKER_PARSERS[type]
  if (!parse) throw new Error(`Unknown import type: ${type}`)
  return parse(data)
}

// Only wire up the message handler inside an actual worker (not when a test
// imports this module)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (e) => {
    const { type, data } = e.data
    try {
      self.postMessage({ events: parseImport(type, data) })
    } catch (err) {
      self.postMessage({ events: [], error: err.message })
    }
  }
}
