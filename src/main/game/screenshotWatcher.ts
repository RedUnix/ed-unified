import { existsSync, statSync, watch, type FSWatcher } from 'fs'
import { join } from 'path'
import { IpcChannels } from '@shared/ipcChannels'
import type { BrowserWindow } from 'electron'
import { getSettings, updateSettings } from '../data/settingsStore'
import { findScreenshotDir } from './edPaths'

const IMAGE_EXTENSIONS = /\.(bmp|png|jpe?g)$/i
/** ED finishes writing high-res captures over a moment; wait before using the file. */
const SETTLE_DELAY_MS = 1500

let watcher: FSWatcher | null = null
let settleTimer: NodeJS.Timeout | null = null

export function defaultScreenshotDir(): string {
  return findScreenshotDir()
}

/**
 * Watches the screenshot folder (configurable in Settings, defaulting to the
 * ED capture folder) and promotes each new capture to the library background
 * (respecting the user's chosen opacity).
 */
export function startScreenshotWatcher(window: BrowserWindow): void {
  if (watcher) return
  const dir = getSettings().screenshotFolderPath ?? defaultScreenshotDir()
  if (!existsSync(dir)) {
    console.warn(`Screenshot watcher: folder not found, not watching: ${dir}`)
    return
  }
  watcher = watch(dir, (_eventType, filename) => {
    if (!filename || !IMAGE_EXTENSIONS.test(filename)) return
    const fullPath = join(dir, filename)
    // Debounce the burst of change events a single screenshot write produces.
    if (settleTimer) clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      if (!getSettings().screenshotBackgroundEnabled) return
      try {
        if (!existsSync(fullPath) || statSync(fullPath).size === 0) return
      } catch {
        return
      }
      const settings = updateSettings({ libraryBackgroundPath: fullPath })
      if (!window.isDestroyed()) {
        window.webContents.send(IpcChannels.settingsChanged, settings)
      }
    }, SETTLE_DELAY_MS)
  })
}

export function stopScreenshotWatcher(): void {
  watcher?.close()
  watcher = null
  if (settleTimer) clearTimeout(settleTimer)
  settleTimer = null
}
