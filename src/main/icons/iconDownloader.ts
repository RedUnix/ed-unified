import { app } from 'electron'
import { join, extname } from 'path'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'

function iconsDir(): string {
  const dir = join(app.getPath('userData'), 'icons')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Downloads a remote icon image and caches it under userData/icons.
 * Returns the local file path, or undefined if the download failed.
 */
export async function downloadIcon(iconUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(iconUrl)
    if (!response.ok) return undefined
    const buffer = Buffer.from(await response.arrayBuffer())
    let ext = extname(new URL(iconUrl).pathname)
    if (!ext || ext.length > 5) ext = '.png'
    const filePath = join(iconsDir(), `${randomUUID()}${ext}`)
    writeFileSync(filePath, buffer)
    return filePath
  } catch {
    return undefined
  }
}
