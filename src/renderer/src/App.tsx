import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import TabStrip from './components/TabStrip'
import TabView from './components/TabView'
import LibraryGrid from './components/LibraryGrid'
import SequencesPanel from './components/SequencesPanel'
import ThemePickerPanel from './components/ThemePickerPanel'
import { LibraryContext, useLibraryProvider, useLibrary } from './state/libraryStore'
import type { AutoDarkSettings, FilesystemToolRecord } from '@shared/types'

interface OpenTab {
  id: string
  url: string
  isEphemeral: boolean
}

type Section = 'library' | 'tab' | 'sequences'

function AppShell() {
  const library = useLibrary()
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [section, setSection] = useState<Section>('library')
  const [tabTitles, setTabTitles] = useState<Record<string, string>>({})
  const [navState, setNavState] = useState<Record<string, { canGoBack: boolean; canGoForward: boolean }>>(
    {}
  )
  const [themePanelOpen, setThemePanelOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    void window.edToolApp.window.isFullscreen().then(setIsFullscreen)
    const unsubscribe = window.edToolApp.onFullscreenChange(setIsFullscreen)
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = window.edToolApp.onTabEvent((event) => {
      if (event.type === 'new-tab') {
        setOpenTabs((prev) =>
          prev.some((t) => t.id === event.tabId)
            ? prev
            : [...prev, { id: event.tabId, url: event.url, isEphemeral: true }]
        )
        setActiveTabId(event.tabId)
        setSection('tab')
      } else if (event.type === 'title-updated') {
        setTabTitles((prev) => ({ ...prev, [event.tabId]: event.title }))
      } else if (event.type === 'nav-state') {
        setNavState((prev) => ({
          ...prev,
          [event.tabId]: { canGoBack: event.canGoBack, canGoForward: event.canGoForward }
        }))
      }
    })
    return unsubscribe
  }, [])

  const openBookmark = useCallback(async (id: string) => {
    setOpenTabs((prev) => (prev.some((t) => t.id === id) ? prev : [...prev, { id, url: '', isEphemeral: false }]))
    setActiveTabId(id)
    setSection('tab')
    await window.edToolApp.tabs.open(id)
  }, [])

  const focusTab = useCallback(async (id: string) => {
    setActiveTabId(id)
    setSection('tab')
    await window.edToolApp.tabs.focus(id)
  }, [])

  const closeTab = useCallback(async (id: string) => {
    await window.edToolApp.tabs.close(id)
    setOpenTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== id)
      setActiveTabId((current) => {
        if (current !== id) return current
        return remaining.length > 0 ? remaining[remaining.length - 1].id : null
      })
      if (remaining.length === 0) setSection('library')
      return remaining
    })
    setTabTitles((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const showLibrary = useCallback(() => {
    setSection('library')
    void window.edToolApp.tabs.hideAll()
  }, [])

  const showSequences = useCallback(() => {
    setSection('sequences')
    void window.edToolApp.tabs.hideAll()
  }, [])

  const handleToolAction = useCallback(
    async (tool: FilesystemToolRecord) => {
      if (tool.installedExePath) {
        await window.edToolApp.tools.launchInstalledExe(tool.id)
        return
      }
      const path = await window.edToolApp.tools.pickInstalledExe()
      if (!path) return
      await window.edToolApp.tools.update(tool.id, { installedExePath: path })
      await library.refresh()
      await window.edToolApp.tools.launchInstalledExe(tool.id)
    },
    [library]
  )

  const handleThemeChange = useCallback(
    async (themeId: string | null) => {
      if (!activeTabId) return
      await window.edToolApp.theming.applyThemeToTab(activeTabId, themeId)
      await library.refresh()
    },
    [activeTabId, library]
  )

  const handleAutoDarkChange = useCallback(
    async (settings: AutoDarkSettings) => {
      if (!activeTabId) return
      await window.edToolApp.theming.applyAutoDarkToTab(activeTabId, settings)
      await library.refresh()
    },
    [activeTabId, library]
  )

  function tabLabel(tab: OpenTab): string {
    if (!tab.isEphemeral) {
      const bookmark = library.bookmarks.find((b) => b.id === tab.id)
      if (bookmark) return bookmark.name
    }
    return tabTitles[tab.id] ?? tab.url
  }

  const tabStripTabs = openTabs.map((t) => ({ id: t.id, label: tabLabel(t) }))
  const activeBookmark = library.bookmarks.find((b) => b.id === activeTabId)
  const showingTab = section === 'tab' && activeTabId !== null
  const activeNavState = activeTabId ? navState[activeTabId] : undefined

  const goBack = useCallback(() => {
    if (activeTabId) void window.edToolApp.tabs.goBack(activeTabId)
  }, [activeTabId])

  const goForward = useCallback(() => {
    if (activeTabId) void window.edToolApp.tabs.goForward(activeTabId)
  }, [activeTabId])

  const toggleThemePanel = useCallback(() => {
    setThemePanelOpen((v) => !v)
  }, [])

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((v) => !v)
  }, [])

  const toggleFullscreen = useCallback(() => {
    void window.edToolApp.window.toggleFullscreen()
  }, [])

  return (
    <div className="app-shell">
      <Sidebar
        bookmarks={library.bookmarks}
        tools={library.tools}
        activeSection={section}
        activeTabId={activeTabId}
        collapsed={sidebarCollapsed}
        isFullscreen={isFullscreen}
        onOpenBookmark={openBookmark}
        onShowLibrary={showLibrary}
        onShowSequences={showSequences}
        onLaunchTool={handleToolAction}
        onToggleCollapsed={toggleSidebarCollapsed}
        onToggleFullscreen={toggleFullscreen}
      />
      <div className="main-area">
        <TabStrip
          tabs={tabStripTabs}
          activeTabId={activeTabId}
          showingTab={showingTab}
          canGoBack={activeNavState?.canGoBack ?? false}
          canGoForward={activeNavState?.canGoForward ?? false}
          themePanelOpen={themePanelOpen}
          onFocus={focusTab}
          onClose={closeTab}
          onGoBack={goBack}
          onGoForward={goForward}
          onToggleThemePanel={toggleThemePanel}
        />
        <div className="content-area">
          {section === 'library' && (
            <LibraryGrid onOpenBookmark={openBookmark} onToolAction={handleToolAction} />
          )}
          {section === 'sequences' && <SequencesPanel />}
          {showingTab && (
            <>
              {themePanelOpen && activeBookmark && (
                <ThemePickerPanel
                  bookmark={activeBookmark}
                  themes={library.themes}
                  onThemeChange={handleThemeChange}
                  onAutoDarkChange={handleAutoDarkChange}
                />
              )}
              <TabView />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const library = useLibraryProvider()
  return (
    <LibraryContext.Provider value={library}>
      <AppShell />
    </LibraryContext.Provider>
  )
}
