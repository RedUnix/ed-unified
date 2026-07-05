import type { WebContents } from 'electron'

/**
 * Makes F12 / Ctrl+Shift+I reliably toggle DevTools for whichever webContents
 * currently has focus -- the app shell's own window or an embedded bookmark
 * tab's WebContentsView are each a separate webContents, so this is wired onto
 * every one of them individually rather than relying on Electron's default menu
 * accelerator (which only targets whichever window last had OS-level focus).
 */
export function registerDevToolsToggle(webContents: WebContents): void {
  webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return
    const isF12 = input.key === 'F12'
    const isCtrlShiftI = input.control && input.shift && input.key.toLowerCase() === 'i'
    if (isF12 || isCtrlShiftI) {
      webContents.toggleDevTools()
    }
  })
}
