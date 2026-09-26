import { useEffect } from 'react'

// Keep these in sync with the static tags in index.html — they're what crawlers
// that don't run JS see, and what this hook restores on unmount.
const DEFAULT_TITLE = 'Timeliner: Turn Text into an Interactive AI Timeline'
const DEFAULT_OG_TITLE = 'Timeliner — AI-Powered Timeline Creator'
const DEFAULT_DESCRIPTION =
  'Turn text into interactive timelines with AI. Paste journal entries, family history, or research notes and get a visual timeline.'
const DEFAULT_CANONICAL = 'https://timeliner.app/'
const DEFAULT_OG_IMAGE = 'https://timeliner.app/og-image.png?v=3'
const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

function applyMeta({ title, ogTitle, description, canonical, ogImage, robots }) {
  document.title = title

  setMeta('meta[name="description"]', 'content', description)
  setMeta('meta[name="robots"]', 'content', robots)

  setMeta('meta[property="og:title"]', 'content', ogTitle)
  setMeta('meta[property="og:description"]', 'content', description)
  setMeta('meta[property="og:url"]', 'content', canonical)
  setMeta('meta[property="og:image"]', 'content', ogImage)

  setMeta('meta[name="twitter:title"]', 'content', ogTitle)
  setMeta('meta[name="twitter:description"]', 'content', description)
  setMeta('meta[name="twitter:image"]', 'content', ogImage)

  const canonicalEl = document.querySelector('link[rel="canonical"]')
  if (canonicalEl) canonicalEl.setAttribute('href', canonical)
}

/**
 * Updates document title, meta description, robots, Open Graph tags, Twitter
 * Card tags, and canonical link. Restores homepage defaults on unmount.
 * Pass `noindex: true` for pages that shouldn't appear in search results.
 */
export default function useDocumentMeta({ title, description, canonical, ogImage, noindex = false } = {}) {
  useEffect(() => {
    applyMeta({
      title: title || DEFAULT_TITLE,
      ogTitle: title || DEFAULT_OG_TITLE,
      description: description || DEFAULT_DESCRIPTION,
      canonical: canonical || DEFAULT_CANONICAL,
      ogImage: ogImage || DEFAULT_OG_IMAGE,
      robots: noindex ? 'noindex, follow' : DEFAULT_ROBOTS,
    })

    return () =>
      applyMeta({
        title: DEFAULT_TITLE,
        ogTitle: DEFAULT_OG_TITLE,
        description: DEFAULT_DESCRIPTION,
        canonical: DEFAULT_CANONICAL,
        ogImage: DEFAULT_OG_IMAGE,
        robots: DEFAULT_ROBOTS,
      })
  }, [title, description, canonical, ogImage, noindex])
}
