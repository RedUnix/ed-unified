import { app } from 'electron'
import type { UpdateCheckResult } from '@shared/types'

const REPO = 'RedUnix/ed-unified'
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`

interface GithubRelease {
  tag_name: string
  html_url: string
}

function parseVersion(raw: string): number[] {
  return raw
    .replace(/^v/i, '')
    .split('.')
    .map((part) => parseInt(part, 10) || 0)
}

function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest)
  const b = parseVersion(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}

/** Falls back to "no update" (rather than throwing) on any network/parse failure -- this is a
 * best-effort background check, not something that should ever interrupt startup. */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion()
  try {
    const response = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) throw new Error(`GitHub API responded ${response.status}`)
    const release = (await response.json()) as GithubRelease
    const latestVersion = release.tag_name.replace(/^v/i, '')
    return {
      available: isNewer(latestVersion, currentVersion),
      currentVersion,
      latestVersion,
      releaseUrl: release.html_url || RELEASES_PAGE
    }
  } catch {
    return { available: false, currentVersion, latestVersion: currentVersion, releaseUrl: RELEASES_PAGE }
  }
}
