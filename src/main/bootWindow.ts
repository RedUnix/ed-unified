import { app, BrowserWindow } from 'electron'
import { join } from 'path'

const BOOT_WIDTH = 560
const BOOT_HEIGHT = 280
const FADE_STEPS = 12
const FADE_INTERVAL_MS = 20

/** Minimum time the boot screen stays visible, so it doesn't flash illegibly on fast launches. */
export const BOOT_MIN_DISPLAY_MS = 900

export function createBootWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: BOOT_WIDTH,
    height: BOOT_HEIGHT,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.once('ready-to-show', () => win.show())

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devServerUrl) {
    win.loadURL(`${devServerUrl}/boot.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/boot.html'))
  }

  return win
}

/** Fades the boot window's opacity out over a short interval, then closes it. */
export function fadeOutAndClose(win: BrowserWindow, onDone: () => void): void {
  if (win.isDestroyed()) {
    onDone()
    return
  }
  let step = FADE_STEPS
  const interval = setInterval(() => {
    step -= 1
    if (step <= 0 || win.isDestroyed()) {
      clearInterval(interval)
      if (!win.isDestroyed()) win.close()
      onDone()
      return
    }
    win.setOpacity(step / FADE_STEPS)
  }, FADE_INTERVAL_MS)
}
