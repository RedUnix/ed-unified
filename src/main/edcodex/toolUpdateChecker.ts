import { IpcChannels } from '@shared/ipcChannels'
import type { BrowserWindow } from 'electron'
import { listTools, updateTool } from '../data/libraryRepository'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours
const INITIAL_DELAY_MS = 10_000

let timer: NodeJS.Timeout | null = null

/**
 * Polls the EDCodex JSON API for tools imported from EDCodex and flags the
 * ones whose DATE_UPDATE moved past the locally stored baseline. Tools
 * imported before baselines existed adopt the first value they see silently
 * (no badge for updates that may predate the import).
 */
export async function checkForToolUpdates(): Promise<boolean> {
  const tools = (await listTools()).filter((t) => t.source.edcodexEntryId)
  let anyChanged = false
  for (const tool of tools) {
    try {
      const response = await fetch(
        `https://edcodex.info/api.php?entry=${tool.source.edcodexEntryId}&render=json`
      )
      if (!response.ok) continue
      const entry = (await response.json()) as { DATE_UPDATE?: string }
      const latest = entry.DATE_UPDATE
      if (!latest) continue

      if (!tool.edcodexDateUpdate) {
        await updateTool(tool.id, { edcodexDateUpdate: latest, edcodexLatestDateUpdate: latest })
      } else if (latest !== tool.edcodexDateUpdate && latest !== tool.edcodexLatestDateUpdate) {
        await updateTool(tool.id, { edcodexLatestDateUpdate: latest, updateAvailable: true })
        anyChanged = true
      } else if (latest !== tool.edcodexDateUpdate && !tool.updateAvailable) {
        await updateTool(tool.id, { updateAvailable: true })
        anyChanged = true
      }
    } catch {
      // Offline or API hiccup -- try again next cycle.
    }
  }
  return anyChanged
}

/** Adopts the newest seen version as the acknowledged baseline and clears the badge. */
export async function acknowledgeToolUpdate(toolId: string): Promise<void> {
  const tool = (await listTools()).find((t) => t.id === toolId)
  if (!tool) return
  await updateTool(toolId, {
    edcodexDateUpdate: tool.edcodexLatestDateUpdate ?? tool.edcodexDateUpdate,
    updateAvailable: false
  })
}

export function startToolUpdateChecks(window: BrowserWindow): void {
  const run = async (): Promise<void> => {
    const changed = await checkForToolUpdates()
    if (changed && !window.isDestroyed()) {
      window.webContents.send(IpcChannels.toolUpdatesChanged)
    }
  }
  setTimeout(() => void run(), INITIAL_DELAY_MS)
  timer = setInterval(() => void run(), CHECK_INTERVAL_MS)
}

export function stopToolUpdateChecks(): void {
  if (timer) clearInterval(timer)
  timer = null
}
