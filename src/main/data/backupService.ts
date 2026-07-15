import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dialog, type BrowserWindow } from 'electron'
import type { AppSettings, BackupBundle, ImportSummary, LibraryDb } from '@shared/types'
import { getDb } from './db'
import { getSettings, updateSettings } from './settingsStore'

const BUNDLE_VERSION = 1

/** Writes the whole library + settings to a user-chosen JSON file. Returns the path, or null if cancelled. */
export async function exportBackup(window: BrowserWindow): Promise<string | null> {
  const result = await dialog.showSaveDialog(window, {
    title: 'Export ED Unified data',
    defaultPath: `ed-unified-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) return null

  const db = await getDb()
  // windowBounds is machine-specific; everything else travels.
  const { windowBounds: _bounds, ...portableSettings } = getSettings()
  const bundle: BackupBundle = {
    app: 'ed-unified',
    bundleVersion: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    library: db.data,
    settings: portableSettings
  }
  writeFileSync(result.filePath, JSON.stringify(bundle, null, 2), 'utf-8')
  return result.filePath
}

/**
 * Restores a backup bundle over the current library + settings. Local icon /
 * background paths that don't exist on this machine are dropped so cards fall
 * back to their remote icon URL instead of a broken image.
 */
export async function importBackup(window: BrowserWindow): Promise<ImportSummary | null> {
  const result = await dialog.showOpenDialog(window, {
    title: 'Import ED Unified data',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null

  let bundle: BackupBundle
  try {
    bundle = JSON.parse(readFileSync(result.filePaths[0], 'utf-8')) as BackupBundle
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (bundle.app !== 'ed-unified' || !bundle.library || !Array.isArray(bundle.library.bookmarks)) {
    throw new Error('That file does not look like an ED Unified backup.')
  }

  const library: LibraryDb = {
    bookmarks: bundle.library.bookmarks ?? [],
    tools: bundle.library.tools ?? [],
    categories: bundle.library.categories ?? [],
    launchSequences: bundle.library.launchSequences ?? [],
    schemaVersion: bundle.library.schemaVersion
  }
  for (const bookmark of library.bookmarks) {
    if (bookmark.iconLocalPath && !existsSync(bookmark.iconLocalPath)) delete bookmark.iconLocalPath
  }
  for (const tool of library.tools) {
    if (tool.iconLocalPath && !existsSync(tool.iconLocalPath)) delete tool.iconLocalPath
    if (tool.installedExePath && !existsSync(tool.installedExePath)) delete tool.installedExePath
  }

  const db = await getDb()
  db.data = library
  await db.write()

  let settings: AppSettings = getSettings()
  if (bundle.settings) {
    const incoming = { ...bundle.settings } as Partial<AppSettings>
    delete incoming.windowBounds
    if (incoming.libraryBackgroundPath && !existsSync(incoming.libraryBackgroundPath)) {
      delete incoming.libraryBackgroundPath
      incoming.libraryBackgroundPath = undefined
    }
    settings = updateSettings(incoming)
  }

  return {
    bookmarks: library.bookmarks.length,
    tools: library.tools.length,
    categories: library.categories.length,
    launchSequences: library.launchSequences.length,
    settings
  }
}
