import { useEffect, useState } from 'react'
import { readPhoto } from '../db'

/** Renders a photo out of IndexedDB, revoking its object URL on unmount. */
export function Photo({ photoId, alt, fallback }: { photoId: string | null; alt: string; fallback: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photoId) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false
    readPhoto(photoId).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoId])

  if (!url) return <span aria-hidden="true">{fallback}</span>
  return <img src={url} alt={alt} />
}
