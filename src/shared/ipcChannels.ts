export const IpcChannels = {
  bookmarksList: 'bookmarks:list',
  bookmarksCreate: 'bookmarks:create',
  bookmarksUpdate: 'bookmarks:update',
  bookmarksDelete: 'bookmarks:delete',
  bookmarksImportFromEdcodexUrl: 'bookmarks:importFromEdcodexUrl',

  toolsList: 'tools:list',
  toolsCreate: 'tools:create',
  toolsUpdate: 'tools:update',
  toolsDelete: 'tools:delete',
  toolsPickInstalledExe: 'tools:pickInstalledExe',
  toolsPickIconFile: 'tools:pickIconFile',
  toolsLaunchInstalledExe: 'tools:launchInstalledExe',

  categoriesList: 'categories:list',
  categoriesCreate: 'categories:create',
  categoriesRename: 'categories:rename',
  categoriesDelete: 'categories:delete',

  libraryReorder: 'library:reorder',

  sequencesList: 'sequences:list',
  sequencesCreate: 'sequences:create',
  sequencesUpdate: 'sequences:update',
  sequencesDelete: 'sequences:delete',
  sequencesGenerateBat: 'sequences:generateBat',
  sequencesRunNow: 'sequences:runNow',
  sequencesRevealBat: 'sequences:revealBat',

  tabsOpen: 'tabs:open',
  tabsClose: 'tabs:close',
  tabsFocus: 'tabs:focus',
  tabsHideAll: 'tabs:hideAll',
  tabsSetBounds: 'tabs:setBounds',
  tabsGoBack: 'tabs:goBack',
  tabsGoForward: 'tabs:goForward',
  tabsEvent: 'tabs:event',
  tabsCopyUrl: 'tabs:copyUrl',
  tabsJsDialog: 'tabs:jsDialog',

  themingListThemes: 'theming:listThemes',
  themingApplyThemeToTab: 'theming:applyThemeToTab',
  themingApplyAutoDarkToTab: 'theming:applyAutoDarkToTab',
  themingSetShellTheme: 'theming:setShellTheme',

  settingsGet: 'settings:get',
  settingsPickLibraryBackground: 'settings:pickLibraryBackground',
  settingsSetLibraryBackground: 'settings:setLibraryBackground',
  settingsSetLibraryBackgroundOpacity: 'settings:setLibraryBackgroundOpacity',
  settingsSetAdblockEnabled: 'settings:setAdblockEnabled',
  settingsSetThemeColors: 'settings:setThemeColors',

  windowToggleFullscreen: 'window:toggleFullscreen',
  windowIsFullscreen: 'window:isFullscreen',
  windowFullscreenChanged: 'window:fullscreenChanged',

  protocolImport: 'protocol:import',

  updatesCheck: 'updates:check',
  updatesOpenReleasePage: 'updates:openReleasePage'
} as const
