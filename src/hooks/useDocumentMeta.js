import { useEffect } from 'react'

const DEFAULT_TITLE = 'Timeliner'
const DEFAULT_DESCRIPTION =
  'Turn text into interactive timelines with AI. Paste journal entries, family history, or research notes and get a visual timeline.'

/**
 * Sets document title and meta description, restoring defaults on unmount.
 */
export default function useDocumentMeta({ title, description } = {}) {
  useEffect(() => {
    if (title) {
      document.title = title
    }

    const metaDesc = document.querySelector('meta[name="description"]')
    if (description && metaDesc) {
      metaDesc.setAttribute('content', description)
    }

    return () => {
      document.title = DEFAULT_TITLE
      if (metaDesc) {
        metaDesc.setAttribute('content', DEFAULT_DESCRIPTION)
      }
    }
  }, [title, description])
}
