import { useEffect, useState } from 'react'
import type { AppSettings } from '@shared/types'
import { iconSrc } from '../utils/iconSrc'

/**
 * The user's library background image at their chosen opacity, for panels
 * that want the same backdrop (sequences, new-tab page). The host element
 * needs position:relative + isolation:isolate (see .library-grid).
 */
export default function PanelBackground() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    void window.edToolApp.settings.get().then(setSettings)
    // Stays current when the screenshot watcher swaps the background.
    const unsubscribe = window.edToolApp.settings.onChanged(setSettings)
    return unsubscribe
  }, [])

  if (!settings?.libraryBackgroundPath) return null
  return (
    <div
      className="library-grid__background"
      style={{
        backgroundImage: `url(${iconSrc(settings.libraryBackgroundPath)})`,
        opacity: settings.libraryBackgroundOpacity
      }}
    />
  )
}
