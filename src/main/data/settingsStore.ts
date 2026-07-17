import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { AppSettings } from '@shared/types'

const DEFAULT_SETTINGS: AppSettings = {
  shellThemeId: 'default',
  libraryBackgroundOpacity: 0.35,
  adblockEnabled: true,
  autoCloseToolsOnGameExit: false,
  screenshotBackgroundEnabled: false,
  webhookEnabled: false,
  webhookPort: 8425,
  chatCommandsEnabled: false,
  chatCommands: [
    { command: 'inara', urlTemplate: 'https://inara.cz/elite/starsystem/?search={arg}' },
    { command: 'edsm', urlTemplate: 'https://www.edsm.net/en/system?systemName={arg}' }
  ],
  analyticsEnabled: true
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

let cache: AppSettings | null = null

function load(): AppSettings {
  if (cache) return cache
  const filePath = settingsPath()
  if (existsSync(filePath)) {
    try {
      const parsed: AppSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(filePath, 'utf-8')) }
      cache = parsed
      return parsed
    } catch {
      // fall through to defaults on parse failure
    }
  }
  const fresh = { ...DEFAULT_SETTINGS }
  cache = fresh
  return fresh
}

function persist(settings: AppSettings): void {
  writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

export function getSettings(): AppSettings {
  return load()
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const updated: AppSettings = { ...load(), ...patch }
  cache = updated
  persist(updated)
  return updated
}
