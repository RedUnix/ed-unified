import { ipcMain, dialog } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { ThemeColors } from '@shared/types'
import { getSettings, updateSettings } from '../data/settingsStore'

export function registerSettingsIpc(): void {
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
}
