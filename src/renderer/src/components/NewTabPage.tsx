import { useEffect, useState } from 'react'
import type { AppSettings } from '@shared/types'
import { iconSrc } from '../utils/iconSrc'

/**
 * Default page for a freshly opened tab, shown until the first navigation.
 * Reuses the library's custom background image and opacity settings.
 */
export default function NewTabPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    void window.edToolApp.settings.get().then(setSettings)
  }, [])

  return (
    <div className="new-tab-page">
      {settings?.libraryBackgroundPath && (
        <div
          className="new-tab-page__background"
          style={{
            backgroundImage: `url(${iconSrc(settings.libraryBackgroundPath)})`,
            opacity: settings.libraryBackgroundOpacity
          }}
        />
      )}
      <div className="new-tab-page__hint">Enter a URL above to start browsing</div>
    </div>
  )
}
