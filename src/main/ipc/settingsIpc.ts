import { ipcMain, dialog, type BrowserWindow } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { AppSettings, ThemeColors } from '@shared/types'
import { getSettings, updateSettings } from '../data/settingsStore'
import { applySettingsSideEffects } from '../services'
import { exportBackup, importBackup } from '../data/backupService'

export function registerSettingsIpc(window: BrowserWindow): void {
  ipcMain.handle(IpcChannels.settingsGet, () => getSettings())

  ipcMain.handle(IpcChannels.settingsPickLibraryBackground, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(IpcChannels.settingsSetLibraryBackground, (_e, path: string | null) =>
    updateSettings({ libraryBackgroundPath: path ?? undefined })
  )

  ipcMain.handle(IpcChannels.settingsSetLibraryBackgroundOpacity, (_e, opacity: number) =>
    updateSettings({ libraryBackgroundOpacity: opacity })
  )

  ipcMain.handle(IpcChannels.settingsSetAdblockEnabled, (_e, enabled: boolean) =>
    updateSettings({ adblockEnabled: enabled })
  )

  ipcMain.handle(IpcChannels.settingsSetThemeColors, (_e, colors: ThemeColors | null) =>
    updateSettings({ themeColors: colors ?? undefined })
  )

  // Generic patch endpoint for the newer feature toggles (auto-close, webhook,
  // chat commands, screenshot background); restarts services as needed.
  ipcMain.handle(IpcChannels.settingsUpdate, (_e, patch: Partial<AppSettings>) => {
    const previous = getSettings()
    const next = updateSettings(patch)
    applySettingsSideEffects(previous, next, window)
    return next
  })

  ipcMain.handle(IpcChannels.backupExport, () => exportBackup(window))
  ipcMain.handle(IpcChannels.backupImport, () => importBackup(window))
}
