import PanelBackground from './PanelBackground'

/**
 * Default page for a freshly opened tab, shown until the first navigation.
 * Reuses the library's custom background image and opacity settings.
 */
export default function NewTabPage() {
  return (
    <div className="new-tab-page">
      <PanelBackground />
      <div className="new-tab-page__hint">Enter a URL above to start browsing</div>
    </div>
  )
}
