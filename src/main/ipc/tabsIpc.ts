import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { TabBounds } from '@shared/types'
import type { WebContentsViewManager } from '../tabs/WebContentsViewManager'
import { listBookmarks } from '../data/libraryRepository'

export function registerTabsIpc(tabsManager: WebContentsViewManager): void {
  ipcMain.handle(IpcChannels.tabsOpen, async (_e, bookmarkId: string) => {
    const bookmarks = await listBookmarks()
    const bookmark = bookmarks.find((b) => b.id === bookmarkId)
    if (!bookmark) throw new Error(`Bookmark not found: ${bookmarkId}`)
    await tabsManager.open(bookmark)
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
}
