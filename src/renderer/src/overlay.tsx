import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/theme-variables.css'
import './styles/overlay.css'

// The overlay window's own DOM is just this control bar; the pinned tab's
// WebContentsView is composited by the main process below it.
const params = new URLSearchParams(window.location.hash.slice(1))
const tabId = params.get('tabId') ?? ''
const title = params.get('title') ?? 'Pinned tab'

function OverlayChrome() {
  return (
    <div className="overlay-bar">
      <span className="overlay-bar__title" title={title}>
        {title}
      </span>
      <input
        className="overlay-bar__opacity"
        type="range"
        min={0.2}
        max={1}
        step={0.05}
        defaultValue={0.92}
        title="Overlay opacity"
        onChange={(e) => void window.edToolApp.overlay.setOpacity(tabId, Number(e.target.value))}
      />
      <button
        className="overlay-bar__btn"
        title="Return to app"
        onClick={() => void window.edToolApp.tabs.unpinFromOverlay(tabId)}
      >
        &#8690;
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <OverlayChrome />
  </React.StrictMode>
)
