import type { BrowserWindow } from 'electron'
import type { WebContentsViewManager } from '../tabs/WebContentsViewManager'
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

export function registerIpc(window: BrowserWindow, tabsManager: WebContentsViewManager): void {
  registerBookmarksIpc()
  registerToolsIpc(window)
  registerCategoriesIpc()
  registerSequencesIpc()
  registerTabsIpc(tabsManager)
  registerThemingIpc(tabsManager)
  registerSettingsIpc()
  registerWindowIpc(window)
  registerLibraryIpc()
  registerUpdatesIpc()
}
