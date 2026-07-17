import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { basename, dirname, extname, join } from 'path'
import { app, shell, type DownloadItem, type Session } from 'electron'
import type { DownloadRecord } from '@shared/types'
import { track } from '../analytics/analytics'

/** Smoothing factor for the exponential moving average over speed samples. */
const SPEED_EMA_ALPHA = 0.3

interface ManagedDownload {
  record: DownloadRecord
  item: DownloadItem
  lastSampleTime: number
  lastSampleBytes: number
}

/**
 * Tracks file downloads started inside embedded tabs. Files save straight to
 * the user's Downloads folder (no save dialog -- the filename is deduped
 * instead), progress/speed/ETA stream to the renderer over one event channel,
 * and a per-download "launch when done" flag opens the finished file with its
 * default handler (e.g. runs a downloaded installer).
 */
export class DownloadManager {
  private downloads = new Map<string, ManagedDownload>()
  private hookedSessions = new WeakSet<Session>()

  constructor(private readonly onEvent: (record: DownloadRecord) => void) {}

  /** Hook a tab session's downloads. Safe to call repeatedly with the same session. */
  attachToSession(session: Session): void {
    if (this.hookedSessions.has(session)) return
    this.hookedSessions.add(session)
    session.on('will-download', (_event, item) => this.track(item))
  }

  list(): DownloadRecord[] {
    return [...this.downloads.values()]
      .map((d) => d.record)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  }

  cancel(id: string): void {
    const download = this.downloads.get(id)
    if (download && download.record.state === 'progressing') download.item.cancel()
  }

  setLaunchWhenDone(id: string, launchWhenDone: boolean): void {
    const download = this.downloads.get(id)
    if (!download) return
    download.record.launchWhenDone = launchWhenDone
    this.onEvent(download.record)
  }

  showInFolder(id: string): void {
    const download = this.downloads.get(id)
    if (download) shell.showItemInFolder(download.record.savePath)
  }

  async openFile(id: string): Promise<void> {
    const download = this.downloads.get(id)
    if (download?.record.state === 'completed') await shell.openPath(download.record.savePath)
  }

  /** Drops finished (completed/cancelled/interrupted) entries from the list. */
  clearFinished(): DownloadRecord[] {
    for (const [id, download] of this.downloads) {
      if (download.record.state !== 'progressing') this.downloads.delete(id)
    }
    return this.list()
  }

  private track(item: DownloadItem): void {
    const id = randomUUID()
    const savePath = dedupeSavePath(join(app.getPath('downloads'), item.getFilename()))
    item.setSavePath(savePath)

    const record: DownloadRecord = {
      id,
      filename: basename(savePath),
      url: item.getURL(),
      savePath,
      directory: dirname(savePath),
      state: 'progressing',
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      bytesPerSecond: 0,
      etaSeconds: null,
      launchWhenDone: false,
      startedAt: new Date().toISOString()
    }
    const download: ManagedDownload = {
      record,
      item,
      lastSampleTime: Date.now(),
      lastSampleBytes: 0
    }
    this.downloads.set(id, download)
    this.onEvent(record)
    track('download_started')

    item.on('updated', (_e, state) => {
      record.receivedBytes = item.getReceivedBytes()
      record.totalBytes = item.getTotalBytes()
      if (state === 'interrupted') {
        // Interrupted-but-resumable stays "progressing"; Electron may resume it.
        record.bytesPerSecond = 0
        record.etaSeconds = null
      } else {
        this.sampleSpeed(download)
      }
      this.onEvent(record)
    })

    item.once('done', (_e, state) => {
      record.receivedBytes = item.getReceivedBytes()
      record.state = state
      record.bytesPerSecond = 0
      record.etaSeconds = null
      this.onEvent(record)
      if (state === 'completed') {
        track('download_completed', { launchWhenDone: record.launchWhenDone ? 1 : 0 })
      }
      if (state === 'completed' && record.launchWhenDone) {
        void shell.openPath(record.savePath)
      }
    })
  }

  private sampleSpeed(download: ManagedDownload): void {
    const now = Date.now()
    const elapsedSeconds = (now - download.lastSampleTime) / 1000
    if (elapsedSeconds <= 0) return
    const instantaneous =
      (download.record.receivedBytes - download.lastSampleBytes) / elapsedSeconds
    download.lastSampleTime = now
    download.lastSampleBytes = download.record.receivedBytes

    const previous = download.record.bytesPerSecond
    const smoothed =
      previous === 0 ? instantaneous : previous + SPEED_EMA_ALPHA * (instantaneous - previous)
    download.record.bytesPerSecond = Math.max(0, smoothed)

    const remaining = download.record.totalBytes - download.record.receivedBytes
    download.record.etaSeconds =
      download.record.totalBytes > 0 && download.record.bytesPerSecond > 1
        ? Math.ceil(remaining / download.record.bytesPerSecond)
        : null
  }
}

/** Chrome-style collision handling: "setup.exe" -> "setup (1).exe". */
function dedupeSavePath(desired: string): string {
  if (!existsSync(desired)) return desired
  const dir = dirname(desired)
  const ext = extname(desired)
  const stem = basename(desired, ext)
  for (let i = 1; ; i++) {
    const candidate = join(dir, `${stem} (${i})${ext}`)
    if (!existsSync(candidate)) return candidate
  }
}
