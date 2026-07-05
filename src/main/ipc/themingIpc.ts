import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { AutoDarkSettings } from '@shared/types'
import { THEME_PRESETS } from '../theming/themePresets'
import * as repo from '../data/libraryRepository'
import { updateSettings } from '../data/settingsStore'
import type { WebContentsViewManager } from '../tabs/WebContentsViewManager'

export function registerThemingIpc(tabsManager: WebContentsViewManager): void {
  ipcMain.handle(IpcChannels.themingListThemes, () => THEME_PRESETS)
  ipcMain.handle(
    IpcChannels.themingApplyThemeToTab,
    async (_e, bookmarkId: string, themeId: string | null) => {
      await repo.updateBookmark(bookmarkId, { themeId })
      await tabsManager.applyTheme(bookmarkId, themeId)
    }
  )
  ipcMain.handle(
    IpcChannels.themingApplyAutoDarkToTab,
    async (_e, bookmarkId: string, settings: AutoDarkSettings) => {
      await repo.updateBookmark(bookmarkId, { autoDark: settings })
      await tabsManager.applyAutoDark(bookmarkId, settings)
    }
  )
  ipcMain.handle(IpcChannels.themingSetShellTheme, (_e, themeId: string) => {
    updateSettings({ shellThemeId: themeId })
  })
}
