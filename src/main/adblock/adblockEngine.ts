import { app } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { ElectronBlocker } from '@ghostery/adblocker-electron'
import type { Session } from 'electron'

function enginePath(): string {
  return join(app.getPath('userData'), 'adblock-engine.bin')
}

let blockerPromise: Promise<ElectronBlocker> | null = null
let cosmeticFiltersClaimed = false

/**
 * Lazily builds (or loads a cached copy of) the ad/tracker-blocking engine.
 * Uses the library's built-in disk-caching hook so subsequent launches don't
 * need to re-fetch the EasyList/EasyPrivacy-based filter lists over the network.
 */
function getAdblocker(): Promise<ElectronBlocker> {
  if (!blockerPromise) {
    blockerPromise = ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
      path: enginePath(),
      read: (path) => readFile(path),
      write: (path, buffer) => writeFile(path, buffer)
    })
  }
  return blockerPromise
}

export async function enableAdblockForSession(session: Session): Promise<void> {
  const blocker = await getAdblocker()

  if (!cosmeticFiltersClaimed) {
    // enableBlockingInSession() registers process-wide ipcMain handlers for
    // cosmetic (CSS-hiding) filters as a side effect. ipcMain.handle() throws if
    // called twice for the same channel, so only the first session we enable
    // blocking for can go through the library's full path -- every bookmark has
    // its own session partition, so this method runs once per opened tab.
    cosmeticFiltersClaimed = true
    blocker.enableBlockingInSession(session)
    return
  }

  // For subsequent sessions, register just the network-level blocking (the
  // primary ad/tracker request blocking) directly, mirroring what
  // BlockingContext.enable() does internally, without re-touching the
  // already-claimed global cosmetic-filter ipcMain handlers.
  session.webRequest.onHeadersReceived({ urls: ['<all_urls>'] }, (details, callback) =>
    blocker.onHeadersReceived(details, callback)
  )
  session.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) =>
    blocker.onBeforeRequest(details, callback)
  )
}
