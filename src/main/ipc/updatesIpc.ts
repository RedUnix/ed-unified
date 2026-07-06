import { ipcMain, shell } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import { checkForUpdate } from '../updates/updateChecker'

export function registerUpdatesIpc(): void {
  ipcMain.handle(IpcChannels.updatesCheck, () => checkForUpdate())
  ipcMain.handle(IpcChannels.updatesOpenReleasePage, (_e, url: string) => {
    shell.openExternal(url)
  })
}
