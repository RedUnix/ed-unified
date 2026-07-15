import { closeSync, existsSync, openSync, readdirSync, readSync, statSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { getSettings } from '../data/settingsStore'
import type { WebContentsViewManager } from '../tabs/WebContentsViewManager'

const POLL_INTERVAL_MS = 2000
const JOURNAL_FILE = /^Journal\..*\.log$/

let timer: NodeJS.Timeout | null = null
let currentFile: string | null = null
let readOffset = 0

export function defaultJournalDir(): string {
  return join(homedir(), 'Saved Games', 'Frontier Developments', 'Elite Dangerous')
}

function newestJournalFile(dir: string): string | null {
  try {
    const files = readdirSync(dir).filter((f) => JOURNAL_FILE.test(f))
    if (files.length === 0) return null
    files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs)
    return join(dir, files[0])
  } catch {
    return null
  }
}

/** Reads bytes appended to the journal since the last poll. */
function readAppended(filePath: string): string {
  const size = statSync(filePath).size
  if (size <= readOffset) return ''
  const fd = openSync(filePath, 'r')
  try {
    const buffer = Buffer.alloc(size - readOffset)
    readSync(fd, buffer, 0, buffer.length, readOffset)
    readOffset = size
    return buffer.toString('utf-8')
  } finally {
    closeSync(fd)
  }
}

function handleJournalLine(line: string, tabsManager: WebContentsViewManager): void {
  let event: { event?: string; Message?: string }
  try {
    event = JSON.parse(line)
  } catch {
    return
  }
  if (event.event !== 'SendText' || !event.Message?.startsWith('!')) return

  const [rawCommand, ...argParts] = event.Message.slice(1).split(/\s+/)
  const arg = argParts.join(' ').trim()
  const command = getSettings().chatCommands.find(
    (c) => c.command.toLowerCase() === rawCommand.toLowerCase()
  )
  if (!command) return

  const url = command.urlTemplate.replaceAll('{arg}', encodeURIComponent(arg))
  // Background tab: the user is in-game -- never steal focus from Elite.
  void tabsManager.openEphemeral(url, { background: true })
}

/**
 * Tails the newest Elite Dangerous journal for "SendText" chat events shaped
 * like "!command args" and opens the mapped URL as a background tab. Starts
 * reading from the file's current end, so only messages typed while the app
 * runs trigger commands.
 */
export function startJournalWatcher(tabsManager: WebContentsViewManager): void {
  if (timer) return
  const dir = defaultJournalDir()
  if (!existsSync(dir)) {
    console.warn(`Journal watcher: folder not found, not watching: ${dir}`)
    return
  }

  timer = setInterval(() => {
    if (!getSettings().chatCommandsEnabled) return
    const newest = newestJournalFile(dir)
    if (!newest) return
    try {
      if (newest !== currentFile) {
        // New session journal -- start at its end, not its beginning.
        currentFile = newest
        readOffset = statSync(newest).size
        return
      }
      const appended = readAppended(newest)
      if (!appended) return
      for (const line of appended.split('\n')) {
        const trimmed = line.trim()
        if (trimmed) handleJournalLine(trimmed, tabsManager)
      }
    } catch {
      // Transient read failure (game writing) -- retry next poll.
    }
  }, POLL_INTERVAL_MS)
}

export function stopJournalWatcher(): void {
  if (timer) clearInterval(timer)
  timer = null
  currentFile = null
  readOffset = 0
}
