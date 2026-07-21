import { join } from 'path'
import { app, BrowserWindow, type WebContentsView } from 'electron'
import type { TabEvent } from '@shared/types'
import type { WebContentsViewManager } from '../tabs/WebContentsViewManager'

/** Height of the overlay window's own drag/controls bar (see overlay.tsx). */
const CHROME_BAR_HEIGHT = 34
const DEFAULT_OPACITY = 0.92

interface ManagedOverlay {
  window: BrowserWindow
  view: WebContentsView
}

/**
 * Floating always-on-top windows that adopt a tab's WebContentsView so sites
 * like Inara can hover over the game in borderless-windowed mode. The view is
 * moved (not copied), so session, login state, and scroll position all travel
 * with it; unpinning hands the view back to the main window.
 */
export class OverlayManager {
  private overlays = new Map<string, ManagedOverlay>()

  constructor(
    private readonly tabsManager: WebContentsViewManager,
    private readonly onEvent: (event: TabEvent) => void
  ) {}

  /** Returns false when the tab has no native view to adopt (e.g. a never-navigated URL-bar tab). */
  pin(tabId: string, title: string): boolean {
    if (this.overlays.has(tabId)) return true
    const view = this.tabsManager.takeViewForOverlay(tabId)
    if (!view) return false

    const window = new BrowserWindow({
      width: 520,
      height: 720,
      minWidth: 300,
      minHeight: 220,
      frame: false,
      resizable: true,
      backgroundColor: '#141416',
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    // 'screen-saver' level floats above fullscreen-borderless game windows.
    window.setAlwaysOnTop(true, 'screen-saver')
    window.setOpacity(DEFAULT_OPACITY)

    const layout = (): void => {
      const [width, height] = window.getContentSize()
      view.setBounds({ x: 0, y: CHROME_BAR_HEIGHT, width, height: height - CHROME_BAR_HEIGHT })
    }
    window.on('resize', layout)
    window.once('ready-to-show', () => {
      window.show()
      layout()
    })
    // The X button (and anything else closing the window) returns the tab to
    // the app rather than destroying a view the main window still owns.
    window.on('close', (event) => {
      if (this.overlays.has(tabId)) {
        event.preventDefault()
        this.unpin(tabId)
      }
    })

    const hash = `tabId=${encodeURIComponent(tabId)}&title=${encodeURIComponent(title)}`
    const devServerUrl = process.env['ELECTRON_RENDERER_URL']
    if (!app.isPackaged && devServerUrl) {
      void window.loadURL(`${devServerUrl}/overlay.html#${hash}`)
    } else {
      void window.loadFile(join(__dirname, '../renderer/overlay.html'), { hash })
    }

    window.contentView.addChildView(view)
    this.overlays.set(tabId, { window, view })
    this.onEvent({ type: 'overlay-changed', tabId, pinned: true })
    return true
  }

  unpin(tabId: string): void {
    const overlay = this.overlays.get(tabId)
    if (!overlay) return
    this.overlays.delete(tabId)
    overlay.window.contentView.removeChildView(overlay.view)
    this.tabsManager.returnViewFromOverlay(tabId)
    overlay.window.destroy()
    this.onEvent({ type: 'overlay-changed', tabId, pinned: false })
  }

  setOpacity(tabId: string, opacity: number): void {
    const overlay = this.overlays.get(tabId)
    if (!overlay) return
    overlay.window.setOpacity(Math.min(1, Math.max(0.2, opacity)))
  }

  destroyAll(): void {
    for (const tabId of [...this.overlays.keys()]) this.unpin(tabId)
  }
}
