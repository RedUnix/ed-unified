import { ipcMain, dialog, type BrowserWindow } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { FilesystemToolRecord, NewToolInput } from '@shared/types'
import * as repo from '../data/libraryRepository'
import { launchPath } from '../platform'
import { showLaunchOverlay } from '../bootWindow'

export function registerToolsIpc(window: BrowserWindow): void {
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
      // Linux/macOS executables usually have no extension, so only Windows filters.
      filters:
        process.platform === 'win32'
          ? [{ name: 'Executables', extensions: ['exe'] }]
          : [{ name: 'All Files', extensions: ['*'] }]
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
    showLaunchOverlay(window, tool.name)
    launchPath(tool.installedExePath)
  })
}
