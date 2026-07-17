import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windowManager'
import { createBootWindow, fadeOutAndClose, BOOT_MIN_DISPLAY_MS } from './bootWindow'
import { registerIpc } from './ipc/registerIpc'
import {
  registerProtocolClient,
  parseProtocolUrl,
  findProtocolUrlInArgv
} from './protocol/protocolHandler'
import { registerLocalFileSchemeAsPrivileged, registerLocalFileProtocolHandler } from './localFileProtocol'
import { initServices } from './services'
import { initAnalytics, track } from './analytics/analytics'
import { IpcChannels } from '@shared/ipcChannels'
import { createBookmark, findOrCreateCategoryByName, updateBookmark } from './data/libraryRepository'
import { importToolFromEdcodexApi } from './edcodex/edcodexImporter'
import { downloadIcon } from './icons/iconDownloader'
import type { ProtocolImportPayload, ProtocolToolImportPayload } from '@shared/types'

let mainWindow: BrowserWindow | null = null

registerLocalFileSchemeAsPrivileged()

async function handleBookmarkImport(payload: ProtocolImportPayload): Promise<void> {
  if (!mainWindow) return
  const categoryIds: string[] = []
  for (const categoryName of payload.categories) {
    const category = await findOrCreateCategoryByName(categoryName, 'edcodex')
    categoryIds.push(category.id)
  }

  let record = await createBookmark({
    name: payload.name,
    url: payload.url,
    iconUrl: payload.icon,
    description: payload.description,
    categoryIds,
    source: { type: 'protocol-import' }
  })

  if (payload.icon) {
    const iconLocalPath = await downloadIcon(payload.icon)
    if (iconLocalPath) record = await updateBookmark(record.id, { iconLocalPath })
  }

  mainWindow.webContents.send(IpcChannels.protocolImport, record)
  track('edcodex_bookmark_imported', { via: 'protocol' })
}

async function handleToolImport(payload: ProtocolToolImportPayload): Promise<void> {
  if (!mainWindow) return
  try {
    const result = await importToolFromEdcodexApi(payload.entryId, payload.icon)
    mainWindow.webContents.send(IpcChannels.protocolImportTool, result)
    if (!result.alreadyExisted) track('edcodex_tool_imported', { via: 'protocol' })
  } catch (err) {
    // e.g. entry isn't Windows-platform, or both API and scrape fetches failed.
    console.error('EDCodex tool import failed:', err)
  }
}

async function handleProtocolUrl(rawUrl: string): Promise<void> {
  const parsed = parseProtocolUrl(rawUrl)
  if (!parsed) return
  if (parsed.kind === 'bookmark') await handleBookmarkImport(parsed.payload)
  else await handleToolImport(parsed.payload)
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  registerProtocolClient()
  void initAnalytics()

  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    const protocolArg = findProtocolUrlInArgv(argv)
    if (protocolArg) void handleProtocolUrl(protocolArg)
  })

  // macOS handoff path; exercised once macOS packaging is added.
  app.on('open-url', (event, url) => {
    event.preventDefault()
    void handleProtocolUrl(url)
  })

  app.whenReady().then(() => {
    registerLocalFileProtocolHandler()

    const bootWindow = createBootWindow()
    let bootShownAt: number | null = null
    bootWindow.once('ready-to-show', () => {
      bootShownAt = Date.now()
    })

    const { window, tabsManager, downloadManager, overlayManager } = createMainWindow(
      () => {
        const elapsed = bootShownAt ? Date.now() - bootShownAt : BOOT_MIN_DISPLAY_MS
        const remaining = Math.max(0, BOOT_MIN_DISPLAY_MS - elapsed)
        setTimeout(() => fadeOutAndClose(bootWindow, () => {}), remaining)
      },
      (url) => void handleProtocolUrl(url)
    )
    mainWindow = window
    registerIpc(window, tabsManager, downloadManager, overlayManager)
    initServices(window, tabsManager)
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
