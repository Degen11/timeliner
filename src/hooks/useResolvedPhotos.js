import { useState, useEffect } from 'react'
import useTimelineStore from '@/store/useTimelineStore'
import { getSignedUrl } from '@/lib/photoSync'

export function useResolvedPhotos(filenames) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const [remoteUrls, setRemoteUrls] = useState({})

  // Identify filenames missing from local photoMap
  const missingLocally = filenames.filter((name) => !photoMap[name])
  // Stable string key so the effect only re-fires when the actual set of
  // missing filenames changes — not on every render. A fresh array used
  // directly as a dependency would re-trigger signed-URL fetches each render.
  const missingKey = missingLocally.join('\n')

  // Fetch signed URLs for missing photos from Supabase Storage
  useEffect(() => {
    if (missingKey === '') return
    let cancelled = false
    const names = missingKey.split('\n')

    async function fetchSignedUrls() {
      const urls = {}
      await Promise.all(
        names.map(async (name) => {
          const url = await getSignedUrl(name)
          if (url) urls[name] = url
        })
      )
      if (!cancelled && Object.keys(urls).length > 0) {
        setRemoteUrls((prev) => ({ ...prev, ...urls }))
      }
    }

    fetchSignedUrls()
    return () => { cancelled = true }
  }, [missingKey])

  return filenames.map((name) => {
    const localUrl = photoMap[name]
    if (localUrl) return { name, url: localUrl }
    const remoteUrl = remoteUrls[name]
    if (remoteUrl) return { name, url: remoteUrl }
    return { name, url: null }
  })
}
