import type { BrowserWindow } from 'electron'
import type { AppSettings } from '@shared/types'
import { getSettings } from './data/settingsStore'
import { startGameWatcher } from './game/gameWatcher'
import { startScreenshotWatcher } from './game/screenshotWatcher'
import { startJournalWatcher } from './game/journalWatcher'
import { startToolUpdateChecks } from './edcodex/toolUpdateChecker'
import { startWebhookServer, stopWebhookServer } from './webhook/webhookServer'
import type { WebContentsViewManager } from './tabs/WebContentsViewManager'

/**
 * Boots the background services. The file/process watchers are cheap and run
 * permanently, each checking its own settings flag per tick, so toggling a
 * setting needs no restart; only the webhook server binds a resource and is
 * started/stopped explicitly.
 */
export function initServices(window: BrowserWindow, tabsManager: WebContentsViewManager): void {
  startGameWatcher()
  startScreenshotWatcher(window)
  startJournalWatcher(tabsManager)
  startToolUpdateChecks(window)
  const settings = getSettings()
  if (settings.webhookEnabled) startWebhookServer(window, settings.webhookPort)
}

/** Applies service side effects of a settings change (currently: the webhook server). */
export function applySettingsSideEffects(
  previous: AppSettings,
  next: AppSettings,
  window: BrowserWindow
): void {
  const webhookChanged =
    previous.webhookEnabled !== next.webhookEnabled || previous.webhookPort !== next.webhookPort
  if (webhookChanged) {
    stopWebhookServer()
    if (next.webhookEnabled) startWebhookServer(window, next.webhookPort)
  }
}
