import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { DownloadManager } from '../downloads/downloadManager'

export function registerDownloadsIpc(downloadManager: DownloadManager): void {
  ipcMain.handle(IpcChannels.downloadsList, () => downloadManager.list())
  ipcMain.handle(IpcChannels.downloadsCancel, (_e, id: string) => {
    downloadManager.cancel(id)
  })
  ipcMain.handle(
    IpcChannels.downloadsSetLaunchWhenDone,
    (_e, id: string, launchWhenDone: boolean) => {
      downloadManager.setLaunchWhenDone(id, launchWhenDone)
    }
  )
  ipcMain.handle(IpcChannels.downloadsShowInFolder, (_e, id: string) => {
    downloadManager.showInFolder(id)
  })
  ipcMain.handle(IpcChannels.downloadsOpenFile, (_e, id: string) => downloadManager.openFile(id))
  ipcMain.handle(IpcChannels.downloadsClearFinished, () => downloadManager.clearFinished())
}
