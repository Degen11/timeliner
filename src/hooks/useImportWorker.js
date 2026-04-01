import { useRef } from 'react'

/**
 * Hook to run import parsing in a web worker for large files.
 * Falls back to main-thread parsing if workers aren't supported.
 *
 * Usage:
 *   const { parseInWorker } = useImportWorker()
 *   const events = await parseInWorker('csv', fileContent)
 */
export default function useImportWorker() {
  const workerRef = useRef(null)

  const getWorker = () => {
    if (!workerRef.current && typeof Worker !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/importWorker.js', import.meta.url),
        { type: 'module' }
      )
    }
    return workerRef.current
  }

  /**
   * Parse file content in a web worker.
   * @param {'csv'|'json'|'ics'|'markdown'} type
   * @param {string} data - File content as text
   * @returns {Promise<Array>} Parsed events
   */
  const parseInWorker = (type, data) => {
    return new Promise((resolve, reject) => {
      const worker = getWorker()
      if (!worker) {
        reject(new Error('Web Workers not supported'))
        return
      }

      const handler = (e) => {
        worker.removeEventListener('message', handler)
        worker.removeEventListener('error', errorHandler)
        if (e.data.error) {
          reject(new Error(e.data.error))
        } else {
          resolve(e.data.events)
        }
      }

      const errorHandler = (err) => {
        worker.removeEventListener('message', handler)
        worker.removeEventListener('error', errorHandler)
        reject(new Error(err.message || 'Worker error'))
      }

      worker.addEventListener('message', handler)
      worker.addEventListener('error', errorHandler)
      worker.postMessage({ type, data })
    })
  }

  return { parseInWorker }
}
