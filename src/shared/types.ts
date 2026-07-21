export interface CategoryRecord {
  id: string
  name: string
  source: 'edcodex' | 'user'
  colorHex?: string
}

export interface BookmarkSource {
  type: 'manual' | 'edcodex-import' | 'protocol-import'
  edcodexEntryId?: string
  edcodexUrl?: string
}

export interface AutoDarkSettings {
  enabled: boolean
  brightness: number
  contrast: number
  sepia: number
}

export interface BookmarkRecord {
  id: string
  kind: 'website'
  name: string
  url: string
  iconUrl?: string
  iconLocalPath?: string
  description?: string
  categoryIds: string[]
  themeId?: string | null
  autoDark?: AutoDarkSettings
  sessionPartition: string
  source: BookmarkSource
  order: number
  createdAt: string
  updatedAt: string
}

export interface ToolSource {
  type: 'manual' | 'edcodex-import'
  edcodexEntryId?: string
  edcodexUrl?: string
}

export interface FilesystemToolRecord {
  id: string
  kind: 'filesystem-tool'
  name: string
  iconUrl?: string
  iconLocalPath?: string
  description?: string
  categoryIds: string[]
  installedExePath?: string
  platform: 'windows'
  source: ToolSource
  /** Last acknowledged EDCodex DATE_UPDATE; baseline for update-available checks. */
  edcodexDateUpdate?: string
  /** Newest DATE_UPDATE seen on EDCodex; kept so acknowledging can adopt it as the new baseline. */
  edcodexLatestDateUpdate?: string
  updateAvailable?: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export type LibraryItem = BookmarkRecord | FilesystemToolRecord

export interface ToolLaunchStep {
  kind: 'tool'
  toolId: string
  delaySeconds: number
}

export interface UrlLaunchStep {
  kind: 'url'
  label: string
  url: string
  delaySeconds: number
}

export type LaunchSequenceStep = ToolLaunchStep | UrlLaunchStep

export interface LaunchSequenceRecord {
  id: string
  name: string
  steps: LaunchSequenceStep[]
  batFilePath?: string
  createdAt: string
  updatedAt: string
}

export interface NewLaunchSequenceInput {
  name: string
  steps: LaunchSequenceStep[]
}

export interface LibraryDb {
  bookmarks: BookmarkRecord[]
  tools: FilesystemToolRecord[]
  categories: CategoryRecord[]
  launchSequences: LaunchSequenceRecord[]
  schemaVersion: number
}

export interface NewBookmarkInput {
  name: string
  url: string
  iconUrl?: string
  iconLocalPath?: string
  description?: string
  categoryIds?: string[]
  source?: BookmarkSource
}

export interface NewToolInput {
  name: string
  iconUrl?: string
  iconLocalPath?: string
  description?: string
  categoryIds?: string[]
  installedExePath?: string
  source?: ToolSource
}

export interface NewCategoryInput {
  name: string
  source?: 'edcodex' | 'user'
  colorHex?: string
}

export interface ThemeRecord {
  id: string
  name: string
  css: string
}

export interface TabBounds {
  x: number
  y: number
  width: number
  height: number
}

export type TabEvent =
  | { type: 'loading'; tabId: string }
  | { type: 'did-finish-load'; tabId: string }
  | { type: 'title-updated'; tabId: string; title: string }
  | { type: 'load-failed'; tabId: string; errorDescription: string }
  | { type: 'new-tab'; tabId: string; url: string; background?: boolean }
  | { type: 'nav-state'; tabId: string; canGoBack: boolean; canGoForward: boolean; url: string }
  | { type: 'find-requested'; tabId: string }
  | { type: 'find-escape'; tabId: string }
  | { type: 'found-in-page'; tabId: string; activeMatchOrdinal: number; matches: number }
  | { type: 'overlay-changed'; tabId: string; pinned: boolean }

export interface ThemeColors {
  accent: string
  accentStrong: string
  accentDim: string
  bgApp: string
}

export interface ChatCommandRecord {
  /** Command name without the leading "!", e.g. "inara". */
  command: string
  /** URL with an {arg} placeholder for the command's argument. */
  urlTemplate: string
}

export interface AppSettings {
  windowBounds?: { x: number; y: number; width: number; height: number }
  shellThemeId: string
  libraryBackgroundPath?: string
  libraryBackgroundOpacity: number
  adblockEnabled: boolean
  themeColors?: ThemeColors
  /** Close app-managed companion tools when EliteDangerous64.exe exits. */
  autoCloseToolsOnGameExit: boolean
  /** Newest ED screenshot automatically becomes the library background. */
  screenshotBackgroundEnabled: boolean
  /** Folder watched for new screenshots; undefined = the ED default (Pictures\Frontier Developments\Elite Dangerous). */
  screenshotFolderPath?: string
  webhookEnabled: boolean
  webhookPort: number
  /** Watch the ED journal for "!command arg" local-chat messages. */
  chatCommandsEnabled: boolean
  chatCommands: ChatCommandRecord[]
}

/** Portable backup bundle produced by Settings > Export. */
export interface BackupBundle {
  app: 'ed-unified'
  bundleVersion: number
  exportedAt: string
  library: LibraryDb
  settings: Omit<AppSettings, 'windowBounds'>
}

export interface ImportSummary {
  bookmarks: number
  tools: number
  categories: number
  launchSequences: number
  settings: AppSettings
}

export interface DownloadRecord {
  id: string
  filename: string
  url: string
  savePath: string
  /** Directory containing savePath, shown in the UI and used for "Show in folder". */
  directory: string
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted'
  receivedBytes: number
  /** 0 when the server didn't report a size. */
  totalBytes: number
  bytesPerSecond: number
  /** null while unknown (no total size or no speed sample yet). */
  etaSeconds: number | null
  launchWhenDone: boolean
  startedAt: string
}

export interface UpdateCheckResult {
  available: boolean
  currentVersion: string
  latestVersion: string
  releaseUrl: string
}

export interface ProtocolImportPayload {
  name: string
  url: string
  icon?: string
  description?: string
  categories: string[]
}

export interface ProtocolToolImportPayload {
  entryId: string
  /** Logo URL scraped from the entry page DOM -- the EDCodex JSON API has no icon field. */
  icon?: string
}

export type ProtocolPayload =
  | { kind: 'bookmark'; payload: ProtocolImportPayload }
  | { kind: 'tool'; payload: ProtocolToolImportPayload }

/** Sent to the renderer after an edtoolapp://import-tool navigation is resolved. */
export interface ProtocolToolImportResult {
  record: FilesystemToolRecord
  downloadUrl?: string
  alreadyExisted: boolean
}
