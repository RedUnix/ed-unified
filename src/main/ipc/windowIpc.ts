import { ipcMain, BrowserWindow } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'

export function registerWindowIpc(window: BrowserWindow): void {
  ipcMain.handle(IpcChannels.windowToggleFullscreen, () => {
    window.setFullScreen(!window.isFullScreen())
  })
  ipcMain.handle(IpcChannels.windowIsFullscreen, () => window.isFullScreen())

  window.on('enter-full-screen', () => window.webContents.send(IpcChannels.windowFullscreenChanged, true))
  window.on('leave-full-screen', () => window.webContents.send(IpcChannels.windowFullscreenChanged, false))
}
