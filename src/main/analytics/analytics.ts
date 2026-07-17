import { app } from 'electron'
import { initialize, trackEvent } from '@aptabase/electron/main'
import { getSettings } from '../data/settingsStore'

const APTABASE_APP_KEY = 'A-US-0624368083'
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

let startedAt = 0

/**
 * Anonymous usage analytics via Aptabase (privacy-first: no user identifiers,
 * and event properties never include URLs, file paths, or names). Every
 * track() checks the Settings opt-out, so turning analytics off takes effect
 * immediately without a restart. initialize() itself sends nothing.
 */
export async function initAnalytics(): Promise<void> {
  try {
    await initialize(APTABASE_APP_KEY)
  } catch {
    return
  }
  startedAt = Date.now()
  track('app_started')

  // Regular heartbeats give Aptabase accurate session-duration numbers and
  // double as "time spent in app" tracking.
  setInterval(() => {
    track('app_heartbeat', { uptimeMinutes: Math.round((Date.now() - startedAt) / 60000) })
  }, HEARTBEAT_INTERVAL_MS)

  // Best effort -- the process may exit before the request completes, but
  // heartbeats bound the loss to 10 minutes.
  app.on('before-quit', () => {
    track('app_closed', { sessionMinutes: Math.round((Date.now() - startedAt) / 60000) })
  })

  // Monitor variant observes crashes without swallowing the default fatal
  // handling; message only (no stack) to keep payloads free of local paths.
  process.on('uncaughtExceptionMonitor', (error) => {
    track('crash', { process: 'main', message: trimError(error) })
  })
  process.on('unhandledRejection', (reason) => {
    track('unhandled_rejection', { process: 'main', message: trimError(reason) })
  })
  app.on('render-process-gone', (_event, _webContents, details) => {
    if (details.reason !== 'clean-exit') {
      track('renderer_crash', { reason: details.reason })
    }
  })
  app.on('child-process-gone', (_event, details) => {
    if (details.reason === 'crashed' || details.reason === 'oom') {
      track('child_process_crash', { type: details.type, reason: details.reason })
    }
  })
}

function trimError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 180)
}

/** Fire-and-forget event; silently dropped when the user opted out. */
export function track(event: string, props?: Record<string, string | number>): void {
  if (!getSettings().analyticsEnabled) return
  try {
    trackEvent(event, props)
  } catch {
    // Analytics must never break the app.
  }
}
