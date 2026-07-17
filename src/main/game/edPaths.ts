import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

/** Elite Dangerous' Steam app id, used to locate its Proton prefix on Linux. */
const ED_STEAM_APP_ID = '359320'

/** Windows-user-profile-relative suffix, valid inside a Proton prefix too. */
const JOURNAL_SUFFIX = ['Saved Games', 'Frontier Developments', 'Elite Dangerous']
const SCREENSHOT_SUFFIX = ['Pictures', 'Frontier Developments', 'Elite Dangerous']

/** Proton-prefix user dirs where the game's "Windows" folders actually live on Linux. */
function protonUserDirs(): string[] {
  const home = homedir()
  return [
    join(home, '.steam', 'steam', 'steamapps', 'compatdata', ED_STEAM_APP_ID, 'pfx', 'drive_c', 'users', 'steamuser'),
    join(home, '.local', 'share', 'Steam', 'steamapps', 'compatdata', ED_STEAM_APP_ID, 'pfx', 'drive_c', 'users', 'steamuser')
  ]
}

function candidateDirs(suffix: string[]): string[] {
  const home = homedir()
  const roots = process.platform === 'linux' ? [home, ...protonUserDirs()] : [home]
  return roots.map((root) => join(root, ...suffix))
}

/**
 * First existing journal folder: the native Windows location, or (on Linux)
 * the game's Proton prefix. Falls back to the native-style path for display
 * even when nothing exists yet.
 */
export function findJournalDir(): string {
  const candidates = candidateDirs(JOURNAL_SUFFIX)
  return candidates.find(existsSync) ?? candidates[0]
}

/** Same resolution for the screenshot capture folder. */
export function findScreenshotDir(): string {
  const candidates = candidateDirs(SCREENSHOT_SUFFIX)
  return candidates.find(existsSync) ?? candidates[0]
}
