import type { BrowserWindow } from 'electron'
import type { WebContentsViewManager } from '../tabs/WebContentsViewManager'
import type { DownloadManager } from '../downloads/downloadManager'
import type { OverlayManager } from '../overlay/OverlayManager'
import { registerDownloadsIpc } from './downloadsIpc'
import { registerToolUpdatesIpc } from './toolUpdatesIpc'
import { registerBookmarksIpc } from './bookmarksIpc'
import { registerToolsIpc } from './toolsIpc'
import { registerCategoriesIpc } from './categoriesIpc'
import { registerSequencesIpc } from './sequencesIpc'
import { registerTabsIpc } from './tabsIpc'
import { registerThemingIpc } from './themingIpc'
import { registerSettingsIpc } from './settingsIpc'
import { registerWindowIpc } from './windowIpc'
import { registerLibraryIpc } from './libraryIpc'
import { registerUpdatesIpc } from './updatesIpc'

export function registerIpc(
  window: BrowserWindow,
  tabsManager: WebContentsViewManager,
  downloadManager: DownloadManager,
  overlayManager: OverlayManager
): void {
  registerBookmarksIpc()
  registerToolsIpc(window)
  registerCategoriesIpc()
  registerSequencesIpc()
  registerTabsIpc(tabsManager, overlayManager)
  registerThemingIpc(tabsManager)
  registerSettingsIpc(window)
  registerWindowIpc(window)
  registerLibraryIpc()
  registerUpdatesIpc()
  registerDownloadsIpc(downloadManager)
  registerToolUpdatesIpc()
}
