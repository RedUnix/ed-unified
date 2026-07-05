import { protocol, net } from 'electron'
import { pathToFileURL } from 'url'

/**
 * Custom scheme for serving local files (tool/bookmark icons, the library
 * background image) into the renderer.
 *
 * Raw `file://` URLs don't work here: Chromium refuses to load `file://`
 * subresources from a page whose own origin isn't `file://` -- which is exactly
 * the case in dev mode, where the renderer is served from
 * `http://localhost:5173`. This restriction is independent of (and not
 * fixable via) Content-Security-Policy. Registering our own "standard" +
 * "secure" scheme sidesteps it entirely, and works identically in both dev and
 * packaged builds (where the shell page itself *is* file://, so raw file://
 * URLs would have happened to work there, but not in dev).
 */
export const LOCAL_FILE_SCHEME = 'edfile'

/** Must be called before app.whenReady(). */
export function registerLocalFileSchemeAsPrivileged(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: LOCAL_FILE_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
    }
  ])
}

/** Must be called after app.whenReady(). */
export function registerLocalFileProtocolHandler(): void {
  protocol.handle(LOCAL_FILE_SCHEME, (request) => {
    const url = new URL(request.url)
    const filePath = url.searchParams.get('path')
    if (!filePath) return new Response('Missing path', { status: 400 })
    return net.fetch(pathToFileURL(filePath).toString())
  })
}
