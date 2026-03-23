import { useState, useEffect } from 'react'
import useTimelineStore from '@/store/useTimelineStore'
import { getSignedUrl } from '@/lib/photoSync'

export function useResolvedPhotos(filenames) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const [remoteUrls, setRemoteUrls] = useState({})

  // Identify filenames missing from local photoMap
  const missingLocally = filenames.filter((name) => !photoMap[name])

  // Fetch signed URLs for missing photos from Supabase Storage
  useEffect(() => {
    if (missingLocally.length === 0) return
    let cancelled = false

    async function fetchSignedUrls() {
      const urls = {}
      await Promise.all(
        missingLocally.map(async (name) => {
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
  }, [missingLocally])

  return filenames.map((name) => {
    const localUrl = photoMap[name]
    if (localUrl) return { name, url: localUrl }
    const remoteUrl = remoteUrls[name]
    if (remoteUrl) return { name, url: remoteUrl }
    return { name, url: null }
  })
}
