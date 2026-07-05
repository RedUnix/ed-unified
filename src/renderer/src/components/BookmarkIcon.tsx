import { useEffect, useState } from 'react'
import { iconSrc } from '../utils/iconSrc'

interface BookmarkIconProps {
  localPath?: string
  remoteUrl?: string
  siteUrl?: string
  alt?: string
  baseClass: string
}

function faviconCandidates(siteUrl?: string): string[] {
  if (!siteUrl) return []
  try {
    // Force https regardless of the bookmark's own scheme: the CSP's
    // `img-src` only allows `https:`, and scraped EDCodex homepage links are
    // often plain `http://`, which would otherwise get every candidate
    // silently CSP-blocked with nothing left to fall back to.
    const host = new URL(siteUrl).host
    const origin = `https://${host}`
    return [`${origin}/apple-touch-icon.png`, `${origin}/favicon.ico`]
  } catch {
    return []
  }
}

export default function BookmarkIcon({ localPath, remoteUrl, siteUrl, alt = '', baseClass }: BookmarkIconProps) {
  const primary = iconSrc(localPath, remoteUrl)
  const candidates = primary ? [primary] : faviconCandidates(siteUrl)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [primary, siteUrl])

  const src = candidates[index]

  return (
    <img
      className={src ? `${baseClass} ${baseClass}--has-image` : baseClass}
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setIndex((i) => i + 1)}
    />
  )
}
