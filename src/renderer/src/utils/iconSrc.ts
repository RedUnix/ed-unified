/**
 * Resolves the best available icon/image source, preferring the locally cached
 * copy. Local paths are served through the app's custom `edfile://` protocol
 * (see src/main/localFileProtocol.ts) rather than a raw `file://` URL: Chromium
 * refuses to load `file://` subresources from a page whose own origin isn't
 * `file://`, which is exactly the case in dev mode (renderer served from
 * `http://localhost:5173`) -- a restriction independent of CSP that a raw
 * `file://` URL can't get around.
 */
export function iconSrc(localPath?: string, remoteUrl?: string): string | undefined {
  if (localPath) return `edfile://local/?path=${encodeURIComponent(localPath)}`
  return remoteUrl
}
