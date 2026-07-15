import { app } from 'electron'
import { resolve } from 'path'
import type { ProtocolPayload } from '@shared/types'

export const PROTOCOL_SCHEME = 'edtoolapp'

export function registerProtocolClient(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      // In dev mode (`electron .`), argv[1] is the literal relative string "."
      // -- if registered unresolved, Windows invokes the protocol handler with
      // its own default working directory (C:\Windows\System32), so "." then
      // resolves to System32 instead of the project folder and Electron fails
      // to find an app there. Resolving to an absolute path here fixes it
      // regardless of what CWD Windows uses when it later launches this.
      app.setAsDefaultProtocolClient(PROTOCOL_SCHEME, process.execPath, [resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME)
  }
}

/** True when the URL's authority-or-path component names the given action. */
function matchesAction(parsed: URL, action: string): boolean {
  return parsed.hostname === action || parsed.pathname === `//${action}`
}

/**
 * Parses links sent by the in-app EDCodex page script (and the standalone
 * browser userscript, which targets the same contract):
 * - `edtoolapp://import-bookmark?name=&url=&icon=&description=&category=...`
 *   (`category` may repeat) -- web-application entries become bookmarks.
 * - `edtoolapp://import-tool?entry=<id>&icon=<url>` -- Windows-platform
 *   entries; the app fetches the rest from the EDCodex JSON API.
 * Returns undefined if the argv/URL doesn't match.
 */
export function parseProtocolUrl(rawUrl: string): ProtocolPayload | undefined {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return undefined
  }
  if (parsed.protocol !== `${PROTOCOL_SCHEME}:`) return undefined

  if (matchesAction(parsed, 'import-bookmark')) {
    const name = parsed.searchParams.get('name')
    const url = parsed.searchParams.get('url')
    if (!name || !url) return undefined
    return {
      kind: 'bookmark',
      payload: {
        name,
        url,
        icon: parsed.searchParams.get('icon') ?? undefined,
        description: parsed.searchParams.get('description') ?? undefined,
        categories: parsed.searchParams.getAll('category')
      }
    }
  }

  if (matchesAction(parsed, 'import-tool')) {
    const entryId = parsed.searchParams.get('entry')
    if (!entryId || !/^\d+$/.test(entryId)) return undefined
    return {
      kind: 'tool',
      payload: {
        entryId,
        icon: parsed.searchParams.get('icon') ?? undefined
      }
    }
  }

  return undefined
}

export function findProtocolUrlInArgv(argv: string[]): string | undefined {
  return argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`))
}
