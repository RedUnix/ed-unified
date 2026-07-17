import { useRef, useState } from 'react'
import TabNavControls from './TabNavControls'
import { ThumbtackIcon } from './icons'

interface TabDescriptor {
  id: string
  label: string
}

interface TabStripProps {
  tabs: TabDescriptor[]
  activeTabId: string | null
  showingTab: boolean
  canGoBack: boolean
  canGoForward: boolean
  themePanelOpen: boolean
  onFocus: (id: string) => void
  onClose: (id: string) => void
  onNewTab: () => void
  onPinActiveTab: () => void
  onGoBack: () => void
  onGoForward: () => void
  onToggleThemePanel: () => void
}

export default function TabStrip({
  tabs,
  activeTabId,
  showingTab,
  canGoBack,
  canGoForward,
  themePanelOpen,
  onFocus,
  onClose,
  onNewTab,
  onPinActiveTab,
  onGoBack,
  onGoForward,
  onToggleThemePanel
}: TabStripProps) {
  const [copiedBubble, setCopiedBubble] = useState<{
    key: number
    left: number
    top: number
  } | null>(null)
  const copiedTimeoutRef = useRef<number | null>(null)

  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>, tabId: string): void => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    void window.edToolApp.tabs.copyUrl(tabId).then((url) => {
      if (!url) return
      if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current)
      setCopiedBubble({ key: Date.now(), left: rect.left + rect.width / 2, top: rect.top })
      copiedTimeoutRef.current = window.setTimeout(() => setCopiedBubble(null), 1200)
    })
  }

  return (
    <div className="tab-strip">
      <TabNavControls
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={
            showingTab && tab.id === activeTabId
              ? 'tab-strip__tab tab-strip__tab--active'
              : 'tab-strip__tab'
          }
          onClick={() => onFocus(tab.id)}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
        >
          <span>{tab.label}</span>
          <span
            className="tab-strip__close"
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose(tab.id)
            }}
          >
            &times;
          </span>
        </button>
      ))}
      <button
        className="tab-nav-controls__btn tab-strip__new-tab"
        onClick={onNewTab}
        title="New tab"
      >
        +
      </button>
      {showingTab && (
        <>
          <button
            className="tab-nav-controls__btn tab-strip__theme-toggle"
            onClick={onPinActiveTab}
            title="Pin as game overlay (always on top)"
          >
            <ThumbtackIcon />
          </button>
          <button
            className={
              themePanelOpen
                ? 'tab-nav-controls__btn tab-strip__pin-toggle tab-strip__theme-toggle--active'
                : 'tab-nav-controls__btn tab-strip__pin-toggle'
            }
            onClick={onToggleThemePanel}
            title="Theme"
          >
            &#9681;
          </button>
        </>
      )}
      {copiedBubble && (
        <span
          key={copiedBubble.key}
          className="tab-strip__copied-bubble"
          style={{ left: copiedBubble.left, top: copiedBubble.top }}
        >
          Copied!
        </span>
      )}
    </div>
  )
}
