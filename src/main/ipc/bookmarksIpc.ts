import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { BookmarkRecord, NewBookmarkInput } from '@shared/types'
import * as repo from '../data/libraryRepository'
import { importFromEdcodexUrl } from '../edcodex/edcodexImporter'

export function registerBookmarksIpc(): void {
  ipcMain.handle(IpcChannels.bookmarksList, () => repo.listBookmarks())
  ipcMain.handle(IpcChannels.bookmarksCreate, (_e, input: NewBookmarkInput) =>
    repo.createBookmark(input)
  )
  ipcMain.handle(
    IpcChannels.bookmarksUpdate,
    (_e, id: string, patch: Partial<BookmarkRecord>) => repo.updateBookmark(id, patch)
  )
  ipcMain.handle(IpcChannels.bookmarksDelete, (_e, id: string) => repo.deleteBookmark(id))
  ipcMain.handle(IpcChannels.bookmarksImportFromEdcodexUrl, (_e, url: string) =>
    importFromEdcodexUrl(url)
  )
}
