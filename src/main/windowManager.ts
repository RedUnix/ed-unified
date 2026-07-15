import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { WebContentsViewManager } from './tabs/WebContentsViewManager'
import { DownloadManager } from './downloads/downloadManager'
import { OverlayManager } from './overlay/OverlayManager'
import { IpcChannels } from '@shared/ipcChannels'
import { getSettings, updateSettings } from './data/settingsStore'
import { registerDevToolsToggle } from './devtools'
import type { DownloadRecord, TabEvent } from '@shared/types'

export function createMainWindow(
  onReadyToShow?: () => void,
  onProtocolUrl?: (url: string) => void
): {
  window: BrowserWindow
  tabsManager: WebContentsViewManager
  downloadManager: DownloadManager
  overlayManager: OverlayManager
} {
  const settings = getSettings()
  const window = new BrowserWindow({
    width: settings.windowBounds?.width ?? 1400,
    height: settings.windowBounds?.height ?? 900,
    x: settings.windowBounds?.x,
    y: settings.windowBounds?.y,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#141416',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.once('ready-to-show', () => {
    window.show()
    onReadyToShow?.()
  })
  window.on('close', () => {
    updateSettings({ windowBounds: window.getBounds() })
  })
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  registerDevToolsToggle(window.webContents)

  const downloadManager = new DownloadManager((record: DownloadRecord) => {
    if (!window.isDestroyed()) window.webContents.send(IpcChannels.downloadsEvent, record)
  })

  const tabsManager = new WebContentsViewManager(
    window,
    (event: TabEvent) => {
      window.webContents.send(IpcChannels.tabsEvent, event)
    },
    (url: string) => onProtocolUrl?.(url),
    (session) => downloadManager.attachToSession(session)
  )

  const overlayManager = new OverlayManager(tabsManager, (event: TabEvent) => {
    if (!window.isDestroyed()) window.webContents.send(IpcChannels.tabsEvent, event)
  })
  // Overlay windows would otherwise keep the app alive after the main window closes.
  window.on('closed', () => overlayManager.destroyAll())

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devServerUrl) {
    window.loadURL(devServerUrl)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return { window, tabsManager, downloadManager, overlayManager }
}
