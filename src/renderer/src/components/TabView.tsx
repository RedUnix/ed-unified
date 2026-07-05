import { useEffect, useRef } from 'react'

/**
 * Reserves screen space for the active WebContentsView, which Electron composites
 * natively outside the DOM. This element renders nothing itself -- it only reports
 * its bounding box to main so the native view can be positioned/resized to match.
 */
export default function TabView() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reportBounds = (): void => {
      const rect = el.getBoundingClientRect()
      void window.edToolApp.tabs.setBounds({
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      })
    }

    reportBounds()
    const observer = new ResizeObserver(reportBounds)
    observer.observe(el)
    window.addEventListener('resize', reportBounds)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', reportBounds)
    }
  }, [])

  return <div ref={ref} className="tab-view-region" />
}
