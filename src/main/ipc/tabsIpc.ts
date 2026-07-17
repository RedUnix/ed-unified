import { clipboard, ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { TabBounds } from '@shared/types'
import type { WebContentsViewManager } from '../tabs/WebContentsViewManager'
import type { OverlayManager } from '../overlay/OverlayManager'
import { listBookmarks } from '../data/libraryRepository'
import { track } from '../analytics/analytics'

export function registerTabsIpc(
  tabsManager: WebContentsViewManager,
  overlayManager: OverlayManager
): void {
  ipcMain.handle(IpcChannels.tabsOpen, async (_e, bookmarkId: string) => {
    const bookmarks = await listBookmarks()
    const bookmark = bookmarks.find((b) => b.id === bookmarkId)
    if (!bookmark) throw new Error(`Bookmark not found: ${bookmarkId}`)
    await tabsManager.open(bookmark)
    track('bookmark_opened')
  })
  ipcMain.handle(IpcChannels.tabsOpenUrl, async (_e, tabId: string, url: string) => {
    // Load failures are reported through the tabs:event channel ('load-failed');
    // don't let the rejected loadURL promise bubble back as an IPC error too.
    await tabsManager.openUrlInTab(tabId, url).catch(() => {})
  })
  ipcMain.handle(IpcChannels.tabsClose, (_e, bookmarkId: string) => {
    tabsManager.close(bookmarkId)
  })
  ipcMain.handle(IpcChannels.tabsFocus, (_e, bookmarkId: string) => {
    tabsManager.focus(bookmarkId)
  })
  ipcMain.handle(IpcChannels.tabsHideAll, () => {
    tabsManager.hideAll()
  })
  ipcMain.handle(IpcChannels.tabsSetBounds, (_e, bounds: TabBounds) => {
    tabsManager.setBounds(bounds)
  })
  ipcMain.handle(IpcChannels.tabsGoBack, (_e, tabId: string) => {
    tabsManager.goBack(tabId)
  })
  ipcMain.handle(IpcChannels.tabsGoForward, (_e, tabId: string) => {
    tabsManager.goForward(tabId)
  })
  ipcMain.handle(IpcChannels.tabsReload, (_e, tabId: string) => {
    tabsManager.reload(tabId)
  })
  ipcMain.handle(IpcChannels.tabsPinToOverlay, (_e, tabId: string, title: string) => {
    overlayManager.pin(tabId, title)
    track('overlay_pinned')
  })
  ipcMain.handle(IpcChannels.tabsUnpinFromOverlay, (_e, tabId: string) => {
    overlayManager.unpin(tabId)
  })
  ipcMain.handle(IpcChannels.overlaySetOpacity, (_e, tabId: string, opacity: number) => {
    overlayManager.setOpacity(tabId, opacity)
  })
  ipcMain.handle(IpcChannels.tabsCopyUrl, (_e, tabId: string) => {
    const url = tabsManager.getUrl(tabId)
    if (url) clipboard.writeText(url)
    return url
  })
  ipcMain.handle(
    IpcChannels.tabsFindInPage,
    (_e, tabId: string, text: string, forward: boolean, findNext: boolean) => {
      tabsManager.findInPage(tabId, text, forward, findNext)
    }
  )
  ipcMain.handle(IpcChannels.tabsStopFindInPage, (_e, tabId: string) => {
    tabsManager.stopFindInPage(tabId)
  })
}
