import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import { acknowledgeToolUpdate, checkForToolUpdates } from '../edcodex/toolUpdateChecker'

export function registerToolUpdatesIpc(): void {
  ipcMain.handle(IpcChannels.toolUpdatesCheckNow, () => checkForToolUpdates())
  ipcMain.handle(IpcChannels.toolUpdatesAcknowledge, (_e, toolId: string) =>
    acknowledgeToolUpdate(toolId)
  )
}
