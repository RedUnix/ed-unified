import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http'
import { app, type BrowserWindow } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import { listBookmarks, listLaunchSequences } from '../data/libraryRepository'

/**
 * Command forwarded to the renderer, which owns tab/section state. The
 * renderer resolves it through the exact same handlers user clicks use.
 */
export interface WebhookCommand {
  type: 'open-bookmark' | 'open-url' | 'run-sequence' | 'refresh-tab' | 'show-library'
  id?: string
  url?: string
}

let server: Server | null = null

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 64 * 1024) reject(new Error('Body too large'))
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function respond(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

/** Matches by exact id first, then case-insensitive name. */
function findByIdOrName<T extends { id: string; name: string }>(
  records: T[],
  idOrName: string
): T | undefined {
  return (
    records.find((r) => r.id === idOrName) ??
    records.find((r) => r.name.toLowerCase() === idOrName.toLowerCase())
  )
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  window: BrowserWindow
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const send = (command: WebhookCommand): void => {
    if (!window.isDestroyed()) window.webContents.send(IpcChannels.webhookCommand, command)
  }

  if (req.method === 'GET' && url.pathname === '/status') {
    respond(res, 200, { ok: true, app: 'ed-unified', version: app.getVersion() })
    return
  }

  if (req.method !== 'POST') {
    respond(res, 405, { ok: false, error: 'Use POST (or GET /status).' })
    return
  }

  let body: Record<string, unknown> = {}
  try {
    const raw = await readBody(req)
    if (raw) body = JSON.parse(raw)
  } catch {
    respond(res, 400, { ok: false, error: 'Invalid JSON body.' })
    return
  }
  const target = typeof body.id === 'string' ? body.id : typeof body.name === 'string' ? body.name : ''

  switch (url.pathname) {
    case '/open-bookmark': {
      const bookmark = findByIdOrName(await listBookmarks(), target)
      if (!bookmark) {
        respond(res, 404, { ok: false, error: `No bookmark matching "${target}".` })
        return
      }
      send({ type: 'open-bookmark', id: bookmark.id })
      respond(res, 200, { ok: true, opened: bookmark.name })
      return
    }
    case '/open-url': {
      const targetUrl = typeof body.url === 'string' ? body.url : ''
      if (!/^https?:\/\//i.test(targetUrl)) {
        respond(res, 400, { ok: false, error: 'Provide an http(s) "url".' })
        return
      }
      send({ type: 'open-url', url: targetUrl })
      respond(res, 200, { ok: true })
      return
    }
    case '/run-sequence': {
      const sequence = findByIdOrName(await listLaunchSequences(), target)
      if (!sequence) {
        respond(res, 404, { ok: false, error: `No launch sequence matching "${target}".` })
        return
      }
      send({ type: 'run-sequence', id: sequence.id })
      respond(res, 200, { ok: true, running: sequence.name })
      return
    }
    case '/refresh-tab':
      send({ type: 'refresh-tab' })
      respond(res, 200, { ok: true })
      return
    case '/show-library':
      send({ type: 'show-library' })
      respond(res, 200, { ok: true })
      return
    default:
      respond(res, 404, {
        ok: false,
        error: 'Unknown endpoint.',
        endpoints: ['GET /status', 'POST /open-bookmark', 'POST /open-url', 'POST /run-sequence', 'POST /refresh-tab', 'POST /show-library']
      })
  }
}

/** Localhost-only control server for VoiceAttack/scripts. Off unless the setting enables it. */
export function startWebhookServer(window: BrowserWindow, port: number): void {
  stopWebhookServer()
  server = createServer((req, res) => {
    void handleRequest(req, res, window).catch(() => respond(res, 500, { ok: false }))
  })
  server.on('error', (err) => {
    console.error(`Webhook server failed on port ${port}:`, err.message)
    server = null
  })
  server.listen(port, '127.0.0.1', () => {
    console.log(`Webhook server listening on http://127.0.0.1:${port}`)
  })
}

export function stopWebhookServer(): void {
  server?.close()
  server = null
}
