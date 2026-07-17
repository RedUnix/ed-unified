import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import TabStrip from './components/TabStrip'
import TabView from './components/TabView'
import LibraryGrid from './components/LibraryGrid'
import SequencesPanel from './components/SequencesPanel'
import ThemePickerPanel from './components/ThemePickerPanel'
import UpdateToast from './components/UpdateToast'
import FindBar from './components/FindBar'
import UrlBar from './components/UrlBar'
import NewTabPage from './components/NewTabPage'
import EdcodexToolAddedModal from './components/EdcodexToolAddedModal'
import DownloadsPanel from './components/DownloadsPanel'
import { LibraryContext, useLibraryProvider, useLibrary } from './state/libraryStore'
import type {
  AutoDarkSettings,
  DownloadRecord,
  FilesystemToolRecord,
  ProtocolToolImportResult,
  UpdateCheckResult
} from '@shared/types'

interface OpenTab {
  id: string
  url: string
  /** 'bookmark' tabs belong to a library entry; 'browse' tabs are user/URL-bar opened. */
  kind: 'bookmark' | 'browse'
  /** False until the tab's first navigation -- the new-tab page shows until then. */
  loaded: boolean
  /** True while the tab floats in an always-on-top overlay window. */
  pinned?: boolean
}

type Section = 'library' | 'tab' | 'sequences' | 'downloads'

/** Turns URL-bar input into a loadable URL: scheme'd input passes through, bare domains get https://, anything else becomes a search. */
function normalizeUrlInput(raw: string): string | null {
  const input = raw.trim()
  if (!input) return null
  if (/^localhost(:\d+)?([/?#]|$)/i.test(input)) return `http://${input}`
  if (/^[a-z][a-z0-9+.-]*:/i.test(input)) return input
  if (!input.includes(' ') && input.includes('.')) return `https://${input}`
  return `https://www.google.com/search?q=${encodeURIComponent(input)}`
}

function AppShell() {
  const library = useLibrary()
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [section, setSection] = useState<Section>('library')
  const [tabTitles, setTabTitles] = useState<Record<string, string>>({})
  const [tabUrls, setTabUrls] = useState<Record<string, string>>({})
  const [navState, setNavState] = useState<Record<string, { canGoBack: boolean; canGoForward: boolean }>>(
    {}
  )
  const [findOpen, setFindOpen] = useState(false)
  const [toolImportResult, setToolImportResult] = useState<ProtocolToolImportResult | null>(null)
  const [downloads, setDownloads] = useState<DownloadRecord[]>([])

  useEffect(() => {
    void window.edToolApp.downloads.list().then(setDownloads)
    const unsubscribe = window.edToolApp.downloads.onEvent((record) => {
      setDownloads((prev) => {
        const index = prev.findIndex((d) => d.id === record.id)
        if (index === -1) return [record, ...prev]
        const next = [...prev]
        next[index] = record
        return next
      })
    })
    return unsubscribe
  }, [])

  const clearFinishedDownloads = useCallback(() => {
    void window.edToolApp.downloads.clearFinished().then(setDownloads)
  }, [])
  const [themePanelOpen, setThemePanelOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null)
  const [updateToastDismissed, setUpdateToastDismissed] = useState(false)

  useEffect(() => {
    void window.edToolApp.window.isFullscreen().then(setIsFullscreen)
    const unsubscribe = window.edToolApp.onFullscreenChange(setIsFullscreen)
    return unsubscribe
  }, [])

  useEffect(() => {
    void window.edToolApp.updates.check().then(setUpdateInfo)
  }, [])

  const openReleasePage = useCallback(() => {
    if (updateInfo) void window.edToolApp.updates.openReleasePage(updateInfo.releaseUrl)
  }, [updateInfo])

  const showUpdateToast = section === 'library' && (updateInfo?.available ?? false) && !updateToastDismissed

  // Auto-dismisses so the toast doesn't reappear every time the user revisits the library
  // (e.g. after closing a tab) -- the sidebar entry stays available as a persistent reminder.
  useEffect(() => {
    if (!showUpdateToast) return undefined
    const timer = setTimeout(() => setUpdateToastDismissed(true), 10000)
    return () => clearTimeout(timer)
  }, [showUpdateToast])

  useEffect(() => {
    const unsubscribe = window.edToolApp.onTabEvent((event) => {
      if (event.type === 'new-tab') {
        setOpenTabs((prev) =>
          prev.some((t) => t.id === event.tabId)
            ? prev
            : [...prev, { id: event.tabId, url: event.url, kind: 'browse', loaded: true }]
        )
        // Background tabs (journal chat commands) join the strip silently.
        if (!event.background) {
          setActiveTabId(event.tabId)
          setSection('tab')
          setFindOpen(false)
        }
      } else if (event.type === 'overlay-changed') {
        setOpenTabs((prev) =>
          prev.map((t) => (t.id === event.tabId ? { ...t, pinned: event.pinned } : t))
        )
      } else if (event.type === 'title-updated') {
        setTabTitles((prev) => ({ ...prev, [event.tabId]: event.title }))
      } else if (event.type === 'nav-state') {
        setNavState((prev) => ({
          ...prev,
          [event.tabId]: { canGoBack: event.canGoBack, canGoForward: event.canGoForward }
        }))
        setTabUrls((prev) => ({ ...prev, [event.tabId]: event.url }))
        setOpenTabs((prev) =>
          prev.some((t) => t.id === event.tabId && !t.loaded)
            ? prev.map((t) => (t.id === event.tabId ? { ...t, loaded: true } : t))
            : prev
        )
      } else if (event.type === 'find-requested') {
        setFindOpen(true)
      } else if (event.type === 'find-escape') {
        setFindOpen(false)
      }
    })
    return unsubscribe
  }, [])

  const openBookmark = useCallback(async (id: string) => {
    setOpenTabs((prev) =>
      prev.some((t) => t.id === id) ? prev : [...prev, { id, url: '', kind: 'bookmark', loaded: true }]
    )
    setActiveTabId(id)
    setSection('tab')
    setFindOpen(false)
    await window.edToolApp.tabs.open(id)
  }, [])

  const focusTab = useCallback(
    async (id: string) => {
      const tab = openTabs.find((t) => t.id === id)
      // Clicking a pinned tab pulls it back out of its overlay window first.
      if (tab?.pinned) await window.edToolApp.tabs.unpinFromOverlay(id)
      setActiveTabId(id)
      setSection('tab')
      setFindOpen(false)
      // A never-navigated browse tab has no native view to focus -- hide the
      // current one so the DOM new-tab page underneath becomes visible.
      if (tab && tab.kind === 'browse' && !tab.loaded) {
        await window.edToolApp.tabs.hideAll()
      } else {
        await window.edToolApp.tabs.focus(id)
      }
    },
    [openTabs]
  )

  const pinActiveTab = useCallback(() => {
    if (!activeTabId) return
    const tab = openTabs.find((t) => t.id === activeTabId)
    const label = tab ? tabTitles[tab.id] ?? tabUrls[tab.id] ?? tab.url : 'Pinned tab'
    void window.edToolApp.tabs.pinToOverlay(activeTabId, label || 'Pinned tab')
    // The view now lives in the overlay window; fall back to the library here.
    setActiveTabId(null)
    setSection('library')
    setFindOpen(false)
  }, [activeTabId, openTabs, tabTitles, tabUrls])

  const openUrlInNewTab = useCallback((url: string) => {
    const id = crypto.randomUUID()
    setOpenTabs((prev) => [...prev, { id, url, kind: 'browse', loaded: true }])
    setActiveTabId(id)
    setSection('tab')
    setFindOpen(false)
    void window.edToolApp.tabs.openUrl(id, url)
  }, [])

  // EDCodex tool-update polling flags new versions in main; just re-fetch.
  useEffect(() => {
    const unsubscribe = window.edToolApp.toolUpdates.onChanged(() => {
      void library.refresh()
    })
    return unsubscribe
  }, [library.refresh])

  // A tool arrived via edtoolapp://import-tool (EDCodex page button). Jump to
  // the library so the new card -- and the DOM modal, which a native tab view
  // would otherwise cover -- are actually visible.
  useEffect(() => {
    const unsubscribe = window.edToolApp.onProtocolToolImport((result) => {
      void library.refresh()
      setSection('library')
      setFindOpen(false)
      void window.edToolApp.tabs.hideAll()
      setToolImportResult(result)
    })
    return unsubscribe
  }, [library.refresh])

  const openNewTab = useCallback(() => {
    const id = crypto.randomUUID()
    setOpenTabs((prev) => [...prev, { id, url: '', kind: 'browse', loaded: false }])
    setActiveTabId(id)
    setSection('tab')
    setFindOpen(false)
    void window.edToolApp.tabs.hideAll()
  }, [])

  const navigateActiveTab = useCallback(
    (input: string) => {
      if (!activeTabId) return
      const url = normalizeUrlInput(input)
      if (!url) return
      setOpenTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, loaded: true } : t)))
      void window.edToolApp.tabs.openUrl(activeTabId, url)
    },
    [activeTabId]
  )

  const closeTab = useCallback(
    async (id: string) => {
      if (id === activeTabId) setFindOpen(false)
      await window.edToolApp.tabs.close(id)
      const remaining = openTabs.filter((t) => t.id !== id)
      setOpenTabs(remaining)
      if (id === activeTabId) {
        const next = remaining.length > 0 ? remaining[remaining.length - 1] : null
        setActiveTabId(next ? next.id : null)
        if (!next) {
          setSection('library')
        } else if (next.kind === 'browse' && !next.loaded) {
          void window.edToolApp.tabs.hideAll()
        } else {
          // Closing the active tab leaves every native view hidden; bring the
          // newly active tab's view back without requiring another click.
          void window.edToolApp.tabs.focus(next.id)
        }
      } else if (remaining.length === 0) {
        setSection('library')
      }
      setTabTitles((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setTabUrls((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    [activeTabId, openTabs]
  )

  const showLibrary = useCallback(() => {
    setSection('library')
    setFindOpen(false)
    void window.edToolApp.tabs.hideAll()
  }, [])

  const showSequences = useCallback(() => {
    setSection('sequences')
    setFindOpen(false)
    void window.edToolApp.tabs.hideAll()
  }, [])

  const showDownloads = useCallback(() => {
    setSection('downloads')
    setFindOpen(false)
    void window.edToolApp.tabs.hideAll()
  }, [])

  // Commands arriving over the local webhook API resolve through the same
  // handlers user clicks use, so state stays consistent.
  useEffect(() => {
    const unsubscribe = window.edToolApp.onWebhookCommand((command) => {
      if (command.type === 'open-bookmark' && command.id) {
        void openBookmark(command.id)
      } else if (command.type === 'open-url' && command.url) {
        openUrlInNewTab(command.url)
      } else if (command.type === 'run-sequence' && command.id) {
        void window.edToolApp.sequences.runNow(command.id)
      } else if (command.type === 'refresh-tab') {
        if (activeTabId) void window.edToolApp.tabs.reload(activeTabId)
      } else if (command.type === 'show-library') {
        showLibrary()
      }
    })
    return unsubscribe
  }, [activeTabId, openBookmark, openUrlInNewTab, showLibrary])

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
    const prefix = tab.pinned ? '\u{1F4CC} ' : ''
    if (tab.kind === 'bookmark') {
      const bookmark = library.bookmarks.find((b) => b.id === tab.id)
      if (bookmark) return prefix + bookmark.name
    }
    return prefix + (tabTitles[tab.id] ?? (tabUrls[tab.id] || tab.url || 'New Tab'))
  }

  const tabStripTabs = openTabs.map((t) => ({ id: t.id, label: tabLabel(t) }))
  const activeBookmark = library.bookmarks.find((b) => b.id === activeTabId)
  const activeTab = openTabs.find((t) => t.id === activeTabId)
  const showingTab = section === 'tab' && activeTabId !== null
  const activeNavState = activeTabId ? navState[activeTabId] : undefined

  // Catches Ctrl+F while focus is in the shell UI itself; Ctrl+F inside an
  // embedded page arrives as a 'find-requested' tab event instead.
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && showingTab) {
        e.preventDefault()
        setFindOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showingTab])

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
      {toolImportResult && (
        <EdcodexToolAddedModal
          result={toolImportResult}
          onOpenDownloadPage={(url) => {
            setToolImportResult(null)
            openUrlInNewTab(url)
          }}
          onClose={() => setToolImportResult(null)}
        />
      )}
      {showUpdateToast && updateInfo && (
        <UpdateToast
          updateInfo={updateInfo}
          onOpenReleasePage={openReleasePage}
          onDismiss={() => setUpdateToastDismissed(true)}
        />
      )}
      <Sidebar
        bookmarks={library.bookmarks}
        tools={library.tools}
        activeSection={section}
        activeTabId={activeTabId}
        collapsed={sidebarCollapsed}
        isFullscreen={isFullscreen}
        activeDownloadCount={downloads.filter((d) => d.state === 'progressing').length}
        onOpenBookmark={openBookmark}
        onShowLibrary={showLibrary}
        onShowSequences={showSequences}
        onShowDownloads={showDownloads}
        onLaunchTool={handleToolAction}
        onToggleCollapsed={toggleSidebarCollapsed}
        onToggleFullscreen={toggleFullscreen}
        updateInfo={updateInfo}
        onOpenReleasePage={openReleasePage}
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
          onNewTab={openNewTab}
          onPinActiveTab={pinActiveTab}
          onGoBack={goBack}
          onGoForward={goForward}
          onToggleThemePanel={toggleThemePanel}
        />
        <div className="content-area">
          {section === 'library' && (
            <LibraryGrid
              onOpenBookmark={openBookmark}
              onToolAction={handleToolAction}
              onOpenUrl={openUrlInNewTab}
            />
          )}
          {section === 'sequences' && <SequencesPanel />}
          {section === 'downloads' && (
            <DownloadsPanel downloads={downloads} onClearFinished={clearFinishedDownloads} />
          )}
          {showingTab && (
            <>
              {activeTab?.kind === 'browse' && (
                <UrlBar
                  key={activeTab.id}
                  currentUrl={(activeTabId ? tabUrls[activeTabId] : '') ?? activeTab.url ?? ''}
                  onNavigate={navigateActiveTab}
                />
              )}
              {findOpen && activeTabId && (
                <FindBar key={activeTabId} tabId={activeTabId} onClose={() => setFindOpen(false)} />
              )}
              {themePanelOpen && activeBookmark && (
                <ThemePickerPanel
                  bookmark={activeBookmark}
                  themes={library.themes}
                  onThemeChange={handleThemeChange}
                  onAutoDarkChange={handleAutoDarkChange}
                />
              )}
              {activeTab?.kind === 'browse' && !activeTab.loaded ? <NewTabPage /> : <TabView />}
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
