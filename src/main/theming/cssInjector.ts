import type { WebContents } from 'electron'
import { getThemeById } from './themePresets'

// Tracks the insertCSS() key returned for each WebContents so it can be removed later.
const insertedKeys = new WeakMap<WebContents, string>()

export async function applyThemeToWebContents(
  webContents: WebContents,
  themeId: string | null | undefined
): Promise<void> {
  const existingKey = insertedKeys.get(webContents)
  if (existingKey) {
    try {
      await webContents.removeInsertedCSS(existingKey)
    } catch {
      // webContents may already be destroyed/navigated away; safe to ignore.
    }
    insertedKeys.delete(webContents)
  }

  const theme = getThemeById(themeId)
  if (!theme) return

  const key = await webContents.insertCSS(theme.css)
  insertedKeys.set(webContents, key)
}
