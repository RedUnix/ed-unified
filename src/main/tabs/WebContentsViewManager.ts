import { randomUUID } from 'crypto'
import { join } from 'path'
import { BrowserWindow, WebContentsView, dialog, ipcMain, session } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { AutoDarkSettings, BookmarkRecord, TabBounds, TabEvent } from '@shared/types'
import { applyThemeToWebContents } from '../theming/cssInjector'
import { buildAutoDarkScript } from '../theming/autoDarkEngine'
import { enableAdblockForSession } from '../adblock/adblockEngine'
import { getSettings } from '../data/settingsStore'
import { registerDevToolsToggle } from '../devtools'
import { buildEdcodexPageScript } from '../edcodex/edcodexPageScript'
import { PROTOCOL_SCHEME } from '../protocol/protocolHandler'
import { showNativePrompt } from '../platform'

const EDCODEX_PAGE_SCRIPT = buildEdcodexPageScript()
const TAB_PRELOAD_PATH = join(__dirname, '../preload/tab.js')

// Reassigns alert/confirm in the page's own main-world context (unlike a
// preload script, `executeJavaScript` from the main process runs here, so
// the override is actually visible to the page). Routes through the bridge
// tabPreload.ts exposes. Safe to re-run on every navigation.
const JS_DIALOG_OVERRIDE_SCRIPT = `(() => {
  const bridge = window.__edToolJsDialogBridge
  if (!bridge) return
  window.alert = (message) => bridge.alert(String(message ?? ''))
  window.confirm = (message) => bridge.confirm(String(message ?? ''))
  window.prompt = (message, defaultValue) => bridge.prompt(String(message ?? ''), String(defaultValue ?? ''))
})()`

interface TabJsDialogRequest {
  kind: 'alert' | 'confirm' | 'prompt'
  message: string
  defaultValue?: string
}

interface ManagedTab {
  view: WebContentsView
  tabId: string
}

export class WebContentsViewManager {
  private tabs = new Map<string, ManagedTab>()
  private activeTabId: string | null = null
  private lastBounds: TabBounds | null = null
  private autoDarkSettings = new Map<string, AutoDarkSettings>()

  constructor(
    private readonly window: BrowserWindow,
    private readonly onEvent: (event: TabEvent) => void,
    private readonly onProtocolUrl: (url: string) => void,
    private readonly onSessionCreated?: (session: Electron.Session) => void
  ) {
    ipcMain.on(IpcChannels.tabsJsDialog, (event, request: TabJsDialogRequest) => {
      if (request.kind === 'confirm') {
        const result = dialog.showMessageBoxSync(this.window, {
          type: 'question',
          buttons: ['OK', 'Cancel'],
          defaultId: 0,
          cancelId: 1,
          message: request.message
        })
        event.returnValue = result === 0
      } else if (request.kind === 'prompt') {
        event.returnValue = showNativePrompt(request.message, request.defaultValue ?? '')
      } else {
        dialog.showMessageBoxSync(this.window, {
          type: 'info',
          buttons: ['OK'],
          message: request.message
        })
        event.returnValue = undefined
      }
    })
  }

  async open(bookmark: BookmarkRecord): Promise<void> {
    let tab = this.tabs.get(bookmark.id)
    if (!tab) {
      const viewSession = session.fromPartition(bookmark.sessionPartition)
      if (getSettings().adblockEnabled) await enableAdblockForSession(viewSession)
      const view = this.createView(viewSession)
      this.wireEvents(view, bookmark.id)
      tab = { view, tabId: bookmark.id }
      this.tabs.set(bookmark.id, tab)
      if (bookmark.autoDark) this.autoDarkSettings.set(bookmark.id, bookmark.autoDark)
      await view.webContents.loadURL(bookmark.url)
      await applyThemeToWebContents(view.webContents, bookmark.themeId)
      if (bookmark.autoDark) await view.webContents.executeJavaScript(buildAutoDarkScript(bookmark.autoDark))
    }
    this.focus(bookmark.id)
  }

  /**
   * Opens an arbitrary URL (e.g. a link clicked inside an embedded site) as a new
   * in-app tab rather than handing it off to the OS browser. Not tied to any
   * persisted bookmark -- the tab and its session disappear once closed.
   */
  async openEphemeral(url: string): Promise<string> {
    const tabId = randomUUID()
    const viewSession = session.fromPartition(`ephemeral-${tabId}`)
    if (getSettings().adblockEnabled) await enableAdblockForSession(viewSession)
    const view = this.createView(viewSession)
    this.wireEvents(view, tabId)
    this.tabs.set(tabId, { view, tabId })
    this.onEvent({ type: 'new-tab', tabId, url })
    await view.webContents.loadURL(url)
    this.focus(tabId)
    return tabId
  }

  /**
   * Loads a URL into a renderer-created tab (the URL-bar "new tab" flow). The
   * renderer owns the tab id; the native view is created lazily on the first
   * navigation and reused for subsequent URL-bar submissions.
   */
  async openUrlInTab(tabId: string, url: string): Promise<void> {
    let tab = this.tabs.get(tabId)
    if (!tab) {
      const viewSession = session.fromPartition(`ephemeral-${tabId}`)
      if (getSettings().adblockEnabled) await enableAdblockForSession(viewSession)
      const view = this.createView(viewSession)
      this.wireEvents(view, tabId)
      tab = { view, tabId }
      this.tabs.set(tabId, tab)
    }
    this.focus(tabId)
    await tab.view.webContents.loadURL(url)
  }

  findInPage(tabId: string, text: string, forward: boolean, findNext: boolean): void {
    const wc = this.tabs.get(tabId)?.view.webContents
    if (!wc || !text) return
    wc.findInPage(text, { forward, findNext })
  }

  stopFindInPage(tabId: string): void {
    const wc = this.tabs.get(tabId)?.view.webContents
    if (!wc) return
    wc.stopFindInPage('clearSelection')
  }

  private createView(viewSession: Electron.Session): WebContentsView {
    this.onSessionCreated?.(viewSession)
    const view = new WebContentsView({
      webPreferences: {
        session: viewSession,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: TAB_PRELOAD_PATH
      }
    })
    this.window.contentView.addChildView(view)
    registerDevToolsToggle(view.webContents)
    return view
  }

  getUrl(tabId: string): string | null {
    return this.tabs.get(tabId)?.view.webContents.getURL() ?? null
  }

  focus(tabId: string): void {
    for (const [id, tab] of this.tabs) {
      tab.view.setVisible(id === tabId)
    }
    this.activeTabId = tabId
    if (this.lastBounds) this.applyBounds(tabId, this.lastBounds)
  }

  /** Hides every tab's native view without forgetting which one is "active" for later focus(). */
  hideAll(): void {
    for (const tab of this.tabs.values()) tab.view.setVisible(false)
  }

  close(tabId: string): void {
    const tab = this.tabs.get(tabId)
    if (!tab) return
    this.window.contentView.removeChildView(tab.view)
    tab.view.webContents.close()
    this.tabs.delete(tabId)
    this.autoDarkSettings.delete(tabId)
    if (this.activeTabId === tabId) this.activeTabId = null
  }

  setBounds(bounds: TabBounds): void {
    this.lastBounds = bounds
    if (this.activeTabId) this.applyBounds(this.activeTabId, bounds)
  }

  private applyBounds(tabId: string, bounds: TabBounds): void {
    const tab = this.tabs.get(tabId)
    if (!tab) return
    tab.view.setBounds(bounds)
  }

  async applyTheme(tabId: string, themeId: string | null): Promise<void> {
    const tab = this.tabs.get(tabId)
    if (!tab) return
    await applyThemeToWebContents(tab.view.webContents, themeId)
  }

  async applyAutoDark(tabId: string, settings: AutoDarkSettings): Promise<void> {
    const tab = this.tabs.get(tabId)
    if (!tab) return
    this.autoDarkSettings.set(tabId, settings)
    await tab.view.webContents.executeJavaScript(buildAutoDarkScript(settings))
  }

  // Note: navigationHistory.canGoBack()/goBack() were observed to be unreliable
  // for WebContentsView in this Electron version (canGoBack() reports false even
  // when getActiveIndex()/getAllEntries() clearly show a prior entry exists), so
  // navigation is driven off the index directly rather than trusting canGoBack().
  goBack(tabId: string): void {
    const wc = this.tabs.get(tabId)?.view.webContents
    if (!wc) return
    const nav = wc.navigationHistory
    const index = nav.getActiveIndex()
    if (index > 0) nav.goToIndex(index - 1)
  }

  goForward(tabId: string): void {
    const wc = this.tabs.get(tabId)?.view.webContents
    if (!wc) return
    const nav = wc.navigationHistory
    const index = nav.getActiveIndex()
    if (index < nav.getAllEntries().length - 1) nav.goToIndex(index + 1)
  }

  destroyAll(): void {
    for (const tabId of [...this.tabs.keys()]) this.close(tabId)
  }

  private wireEvents(view: WebContentsView, tabId: string): void {
    const wc = view.webContents
    wc.on('did-start-loading', () => this.onEvent({ type: 'loading', tabId }))
    wc.on('dom-ready', () => void wc.executeJavaScript(JS_DIALOG_OVERRIDE_SCRIPT))
    wc.on('did-finish-load', () => {
      this.onEvent({ type: 'did-finish-load', tabId })
      const autoDark = this.autoDarkSettings.get(tabId)
      if (autoDark) void wc.executeJavaScript(buildAutoDarkScript(autoDark))
      // Cheap no-op on any page that isn't an EDCodex tool page; see edcodexPageScript.ts.
      void wc.executeJavaScript(EDCODEX_PAGE_SCRIPT)
    })
    wc.on('page-title-updated', (_e, title) =>
      this.onEvent({ type: 'title-updated', tabId, title })
    )
    wc.on('did-fail-load', (_e, _code, errorDescription) =>
      this.onEvent({ type: 'load-failed', tabId, errorDescription })
    )
    const emitNavState = (): void => {
      const nav = wc.navigationHistory
      const index = nav.getActiveIndex()
      this.onEvent({
        type: 'nav-state',
        tabId,
        canGoBack: index > 0,
        canGoForward: index < nav.getAllEntries().length - 1,
        url: wc.getURL()
      })
    }
    wc.on('did-navigate', emitNavState)
    wc.on('did-navigate-in-page', emitNavState)
    // Keyboard focus normally lives inside the embedded page, so the renderer
    // shell never sees Ctrl+F -- intercept it here and let the renderer open
    // its find bar. Escape is forwarded (without swallowing it) so an open
    // find bar can close even while the page has focus.
    wc.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return
      if ((input.control || input.meta) && input.key.toLowerCase() === 'f') {
        event.preventDefault()
        this.onEvent({ type: 'find-requested', tabId })
      } else if (input.key === 'Escape') {
        this.onEvent({ type: 'find-escape', tabId })
      }
    })
    wc.on('found-in-page', (_e, result) => {
      this.onEvent({
        type: 'found-in-page',
        tabId,
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches
      })
    })
    // The "Add to ED Unified" link injected by edcodexPageScript.ts navigates
    // to an edtoolapp:// URL -- intercept that here and resolve it entirely
    // in-app (same parsing/creation path as the OS-level protocol handoff),
    // instead of letting it escape to the OS as an actual protocol launch.
    wc.on('will-navigate', (event, navigateUrl) => {
      if (navigateUrl.startsWith(`${PROTOCOL_SCHEME}://`)) {
        event.preventDefault()
        this.onProtocolUrl(navigateUrl)
      }
    })
    // Links/popups from embedded third-party sites open as new in-app tabs
    // instead of handing off to the OS browser.
    wc.setWindowOpenHandler(({ url }) => {
      void this.openEphemeral(url)
      return { action: 'deny' }
    })
  }
}
