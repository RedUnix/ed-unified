import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type {
  AppSettings,
  AutoDarkSettings,
  BookmarkRecord,
  NewBookmarkInput,
  FilesystemToolRecord,
  NewToolInput,
  NewCategoryInput,
  CategoryRecord,
  LaunchSequenceRecord,
  NewLaunchSequenceInput,
  TabBounds,
  TabEvent,
  ThemeColors,
  ThemeRecord,
  UpdateCheckResult
} from '@shared/types'

const api = {
  bookmarks: {
    list: (): Promise<BookmarkRecord[]> => ipcRenderer.invoke(IpcChannels.bookmarksList),
    create: (input: NewBookmarkInput): Promise<BookmarkRecord> =>
      ipcRenderer.invoke(IpcChannels.bookmarksCreate, input),
    update: (id: string, patch: Partial<BookmarkRecord>): Promise<BookmarkRecord> =>
      ipcRenderer.invoke(IpcChannels.bookmarksUpdate, id, patch),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.bookmarksDelete, id),
    importFromEdcodexUrl: (url: string): Promise<BookmarkRecord> =>
      ipcRenderer.invoke(IpcChannels.bookmarksImportFromEdcodexUrl, url)
  },
  tools: {
    list: (): Promise<FilesystemToolRecord[]> => ipcRenderer.invoke(IpcChannels.toolsList),
    create: (input: NewToolInput): Promise<FilesystemToolRecord> =>
      ipcRenderer.invoke(IpcChannels.toolsCreate, input),
    update: (id: string, patch: Partial<FilesystemToolRecord>): Promise<FilesystemToolRecord> =>
      ipcRenderer.invoke(IpcChannels.toolsUpdate, id, patch),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.toolsDelete, id),
    pickInstalledExe: (): Promise<string | null> =>
      ipcRenderer.invoke(IpcChannels.toolsPickInstalledExe),
    pickIconFile: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.toolsPickIconFile),
    launchInstalledExe: (id: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.toolsLaunchInstalledExe, id)
  },
  categories: {
    list: (): Promise<CategoryRecord[]> => ipcRenderer.invoke(IpcChannels.categoriesList),
    create: (input: NewCategoryInput): Promise<CategoryRecord> =>
      ipcRenderer.invoke(IpcChannels.categoriesCreate, input),
    rename: (id: string, name: string): Promise<CategoryRecord> =>
      ipcRenderer.invoke(IpcChannels.categoriesRename, id, name),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.categoriesDelete, id)
  },
  sequences: {
    list: (): Promise<LaunchSequenceRecord[]> => ipcRenderer.invoke(IpcChannels.sequencesList),
    create: (input: NewLaunchSequenceInput): Promise<LaunchSequenceRecord> =>
      ipcRenderer.invoke(IpcChannels.sequencesCreate, input),
    update: (id: string, patch: Partial<LaunchSequenceRecord>): Promise<LaunchSequenceRecord> =>
      ipcRenderer.invoke(IpcChannels.sequencesUpdate, id, patch),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.sequencesDelete, id),
    generateBat: (id: string): Promise<LaunchSequenceRecord> =>
      ipcRenderer.invoke(IpcChannels.sequencesGenerateBat, id),
    runNow: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.sequencesRunNow, id),
    revealBat: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.sequencesRevealBat, id)
  },
  tabs: {
    open: (bookmarkId: string): Promise<void> => ipcRenderer.invoke(IpcChannels.tabsOpen, bookmarkId),
    close: (tabId: string): Promise<void> => ipcRenderer.invoke(IpcChannels.tabsClose, tabId),
    focus: (tabId: string): Promise<void> => ipcRenderer.invoke(IpcChannels.tabsFocus, tabId),
    hideAll: (): Promise<void> => ipcRenderer.invoke(IpcChannels.tabsHideAll),
    setBounds: (bounds: TabBounds): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.tabsSetBounds, bounds),
    goBack: (tabId: string): Promise<void> => ipcRenderer.invoke(IpcChannels.tabsGoBack, tabId),
    goForward: (tabId: string): Promise<void> => ipcRenderer.invoke(IpcChannels.tabsGoForward, tabId),
    copyUrl: (tabId: string): Promise<string | null> =>
      ipcRenderer.invoke(IpcChannels.tabsCopyUrl, tabId)
  },
  theming: {
    listThemes: (): Promise<ThemeRecord[]> => ipcRenderer.invoke(IpcChannels.themingListThemes),
    applyThemeToTab: (bookmarkId: string, themeId: string | null): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.themingApplyThemeToTab, bookmarkId, themeId),
    applyAutoDarkToTab: (bookmarkId: string, settings: AutoDarkSettings): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.themingApplyAutoDarkToTab, bookmarkId, settings),
    setShellTheme: (themeId: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.themingSetShellTheme, themeId)
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannels.settingsGet),
    pickLibraryBackground: (): Promise<string | null> =>
      ipcRenderer.invoke(IpcChannels.settingsPickLibraryBackground),
    setLibraryBackground: (path: string | null): Promise<AppSettings> =>
      ipcRenderer.invoke(IpcChannels.settingsSetLibraryBackground, path),
    setLibraryBackgroundOpacity: (opacity: number): Promise<AppSettings> =>
      ipcRenderer.invoke(IpcChannels.settingsSetLibraryBackgroundOpacity, opacity),
    setAdblockEnabled: (enabled: boolean): Promise<AppSettings> =>
      ipcRenderer.invoke(IpcChannels.settingsSetAdblockEnabled, enabled),
    setThemeColors: (colors: ThemeColors | null): Promise<AppSettings> =>
      ipcRenderer.invoke(IpcChannels.settingsSetThemeColors, colors)
  },
  window: {
    toggleFullscreen: (): Promise<void> => ipcRenderer.invoke(IpcChannels.windowToggleFullscreen),
    isFullscreen: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.windowIsFullscreen)
  },
  library: {
    reorder: (orderedIds: string[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.libraryReorder, orderedIds)
  },
  updates: {
    check: (): Promise<UpdateCheckResult> => ipcRenderer.invoke(IpcChannels.updatesCheck),
    openReleasePage: (url: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.updatesOpenReleasePage, url)
  },
  onTabEvent: (cb: (evt: TabEvent) => void): (() => void) => {
    const listener = (_e: unknown, evt: TabEvent): void => cb(evt)
    ipcRenderer.on(IpcChannels.tabsEvent, listener)
    return () => ipcRenderer.removeListener(IpcChannels.tabsEvent, listener)
  },
  onProtocolImport: (cb: (record: BookmarkRecord) => void): (() => void) => {
    const listener = (_e: unknown, record: BookmarkRecord): void => cb(record)
    ipcRenderer.on(IpcChannels.protocolImport, listener)
    return () => ipcRenderer.removeListener(IpcChannels.protocolImport, listener)
  },
  onFullscreenChange: (cb: (isFullscreen: boolean) => void): (() => void) => {
    const listener = (_e: unknown, isFullscreen: boolean): void => cb(isFullscreen)
    ipcRenderer.on(IpcChannels.windowFullscreenChanged, listener)
    return () => ipcRenderer.removeListener(IpcChannels.windowFullscreenChanged, listener)
  }
}

export type EdToolAppApi = typeof api

contextBridge.exposeInMainWorld('edToolApp', api)
