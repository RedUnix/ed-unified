import TabNavControls from './TabNavControls'

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
  onGoBack,
  onGoForward,
  onToggleThemePanel
}: TabStripProps) {
  if (tabs.length === 0) return null
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
      {showingTab && (
        <button
          className={
            themePanelOpen
              ? 'tab-nav-controls__btn tab-strip__theme-toggle tab-strip__theme-toggle--active'
              : 'tab-nav-controls__btn tab-strip__theme-toggle'
          }
          onClick={onToggleThemePanel}
          title="Theme"
        >
          &#9681;
        </button>
      )}
    </div>
  )
}
