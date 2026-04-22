import { useEffect } from 'react'

const DEFAULT_TITLE = 'Timeliner'
const DEFAULT_OG_TITLE = 'Timeliner — AI-Powered Timeline Creator'
const DEFAULT_DESCRIPTION =
  'Turn text into interactive timelines with AI. Paste journal entries, family history, or research notes and get a visual timeline.'
const DEFAULT_CANONICAL = 'https://timeliner.app/'
const DEFAULT_OG_IMAGE = 'https://timeliner.app/og-image.png'

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

/**
 * Updates document title, meta description, Open Graph tags, Twitter Card tags,
 * and canonical link. Restores homepage defaults on unmount.
 */
export default function useDocumentMeta({ title, description, canonical, ogImage } = {}) {
  useEffect(() => {
    const resolvedTitle = title || DEFAULT_TITLE
    const resolvedDesc = description || DEFAULT_DESCRIPTION
    const resolvedCanonical = canonical || DEFAULT_CANONICAL
    const resolvedImage = ogImage || DEFAULT_OG_IMAGE

    document.title = resolvedTitle

    setMeta('meta[name="description"]', 'content', resolvedDesc)

    setMeta('meta[property="og:title"]', 'content', resolvedTitle)
    setMeta('meta[property="og:description"]', 'content', resolvedDesc)
    setMeta('meta[property="og:url"]', 'content', resolvedCanonical)
    setMeta('meta[property="og:image"]', 'content', resolvedImage)

    setMeta('meta[name="twitter:title"]', 'content', resolvedTitle)
    setMeta('meta[name="twitter:description"]', 'content', resolvedDesc)
    setMeta('meta[name="twitter:image"]', 'content', resolvedImage)

    const canonicalEl = document.querySelector('link[rel="canonical"]')
    if (canonicalEl) canonicalEl.setAttribute('href', resolvedCanonical)

    return () => {
      document.title = DEFAULT_TITLE
      setMeta('meta[name="description"]', 'content', DEFAULT_DESCRIPTION)
      setMeta('meta[property="og:title"]', 'content', DEFAULT_OG_TITLE)
      setMeta('meta[property="og:description"]', 'content', DEFAULT_DESCRIPTION)
      setMeta('meta[property="og:url"]', 'content', DEFAULT_CANONICAL)
      setMeta('meta[property="og:image"]', 'content', DEFAULT_OG_IMAGE)
      setMeta('meta[name="twitter:title"]', 'content', DEFAULT_OG_TITLE)
      setMeta('meta[name="twitter:description"]', 'content', DEFAULT_DESCRIPTION)
      setMeta('meta[name="twitter:image"]', 'content', DEFAULT_OG_IMAGE)
      const canonicalEl = document.querySelector('link[rel="canonical"]')
      if (canonicalEl) canonicalEl.setAttribute('href', DEFAULT_CANONICAL)
    }
  }, [title, description, canonical, ogImage])
}
