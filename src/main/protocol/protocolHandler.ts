import { app } from 'electron'
import { resolve } from 'path'
import type { ProtocolImportPayload } from '@shared/types'

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

/**
 * Parses `edtoolapp://import-bookmark?name=&url=&icon=&description=&category=...`
 * links sent by the in-app EDCodex page script (and the standalone browser
 * userscript, which targets the same contract). `category` may repeat for
 * multiple categories. Returns undefined if the argv/URL doesn't match.
 */
export function parseProtocolUrl(rawUrl: string): ProtocolImportPayload | undefined {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return undefined
  }
  if (parsed.protocol !== `${PROTOCOL_SCHEME}:`) return undefined
  if (parsed.hostname !== 'import-bookmark' && parsed.pathname !== '//import-bookmark') return undefined

  const name = parsed.searchParams.get('name')
  const url = parsed.searchParams.get('url')
  if (!name || !url) return undefined

  return {
    name,
    url,
    icon: parsed.searchParams.get('icon') ?? undefined,
    description: parsed.searchParams.get('description') ?? undefined,
    categories: parsed.searchParams.getAll('category')
  }
}

export function findProtocolUrlInArgv(argv: string[]): string | undefined {
  return argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`))
}
