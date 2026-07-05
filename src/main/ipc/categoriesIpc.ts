import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { NewCategoryInput } from '@shared/types'
import * as repo from '../data/libraryRepository'

export function registerCategoriesIpc(): void {
  ipcMain.handle(IpcChannels.categoriesList, () => repo.listCategories())
  ipcMain.handle(IpcChannels.categoriesCreate, (_e, input: NewCategoryInput) =>
    repo.createCategory(input)
  )
  ipcMain.handle(IpcChannels.categoriesRename, (_e, id: string, name: string) =>
    repo.renameCategory(id, name)
  )
  ipcMain.handle(IpcChannels.categoriesDelete, (_e, id: string) => repo.deleteCategory(id))
}
