import { ipcMain, dialog } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { FilesystemToolRecord, NewToolInput } from '@shared/types'
import * as repo from '../data/libraryRepository'
import { launchPath } from '../platform'

export function registerToolsIpc(): void {
  ipcMain.handle(IpcChannels.toolsList, () => repo.listTools())
  ipcMain.handle(IpcChannels.toolsCreate, (_e, input: NewToolInput) => repo.createTool(input))
  ipcMain.handle(
    IpcChannels.toolsUpdate,
    (_e, id: string, patch: Partial<FilesystemToolRecord>) => repo.updateTool(id, patch)
  )
  ipcMain.handle(IpcChannels.toolsDelete, (_e, id: string) => repo.deleteTool(id))

  ipcMain.handle(IpcChannels.toolsPickInstalledExe, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Executables', extensions: ['exe'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(IpcChannels.toolsPickIconFile, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'ico', 'svg', 'gif', 'webp'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(IpcChannels.toolsLaunchInstalledExe, async (_e, id: string) => {
    const tools = await repo.listTools()
    const tool = tools.find((t) => t.id === id)
    if (!tool?.installedExePath) throw new Error('No installed program path set for this tool.')
    launchPath(tool.installedExePath)
  })
}
