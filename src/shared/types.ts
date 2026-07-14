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
  | { type: 'new-tab'; tabId: string; url: string }
  | { type: 'nav-state'; tabId: string; canGoBack: boolean; canGoForward: boolean; url: string }
  | { type: 'find-requested'; tabId: string }
  | { type: 'find-escape'; tabId: string }
  | { type: 'found-in-page'; tabId: string; activeMatchOrdinal: number; matches: number }

export interface ThemeColors {
  accent: string
  accentStrong: string
  accentDim: string
  bgApp: string
}

export interface AppSettings {
  windowBounds?: { x: number; y: number; width: number; height: number }
  shellThemeId: string
  libraryBackgroundPath?: string
  libraryBackgroundOpacity: number
  adblockEnabled: boolean
  themeColors?: ThemeColors
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
