import { useEffect, useRef } from 'react'
import { useQueryStates, parseAsString, parseAsArrayOf } from 'nuqs'
import useTimelineStore from '@/store/useTimelineStore'

const filterParsers = {
  q: parseAsString.withDefault(''),
  people: parseAsArrayOf(parseAsString, ',').withDefault([]),
  tags: parseAsArrayOf(parseAsString, ',').withDefault([]),
  from: parseAsString.withDefault(''),
  to: parseAsString.withDefault(''),
}

const nuqsOptions = { history: 'push', shallow: false }

/**
 * Bidirectional sync between URL search params and Zustand filter state.
 * - URL params → Zustand on mount (restores filters from shared URLs)
 * - Zustand → URL params on filter changes (keeps URL in sync)
 */
export default function useFilterParams() {
  const [urlFilters, setUrlFilters] = useQueryStates(filterParsers, nuqsOptions)
  const filters = useTimelineStore((s) => s.filters)
  const setFilters = useTimelineStore((s) => s.setFilters)
  const initialized = useRef(false)

  // On mount: if URL has filter params, push them into Zustand
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const hasUrlFilters =
      urlFilters.q ||
      urlFilters.people.length > 0 ||
      urlFilters.tags.length > 0 ||
      urlFilters.from ||
      urlFilters.to
    if (hasUrlFilters) {
      setFilters({
        search: urlFilters.q,
        people: urlFilters.people,
        tags: urlFilters.tags,
        dateFrom: urlFilters.from,
        dateTo: urlFilters.to,
      })
    }
  }, [urlFilters, setFilters])

  // Zustand → URL: when store filters change, update URL params
  useEffect(() => {
    if (!initialized.current) return

    const urlQ = urlFilters.q || ''
    const urlPeople = urlFilters.people || []
    const urlTags = urlFilters.tags || []
    const urlFrom = urlFilters.from || ''
    const urlTo = urlFilters.to || ''

    const storeSearch = filters.search || ''
    const storePeople = filters.people || []
    const storeTags = filters.tags || []
    const storeFrom = filters.dateFrom || ''
    const storeTo = filters.dateTo || ''

    // Only update URL if Zustand state differs from current URL state
    if (
      storeSearch !== urlQ ||
      storePeople.join(',') !== urlPeople.join(',') ||
      storeTags.join(',') !== urlTags.join(',') ||
      storeFrom !== urlFrom ||
      storeTo !== urlTo
    ) {
      setUrlFilters({
        q: storeSearch || null,
        people: storePeople.length > 0 ? storePeople : null,
        tags: storeTags.length > 0 ? storeTags : null,
        from: storeFrom || null,
        to: storeTo || null,
      })
    }
  }, [filters.search, filters.people, filters.tags, filters.dateFrom, filters.dateTo, urlFilters, setUrlFilters])
}
