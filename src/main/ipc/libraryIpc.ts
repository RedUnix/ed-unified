import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import * as repo from '../data/libraryRepository'

export function registerLibraryIpc(): void {
  ipcMain.handle(IpcChannels.libraryReorder, (_e, orderedIds: string[]) =>
    repo.reorderLibraryItems(orderedIds)
  )
}
