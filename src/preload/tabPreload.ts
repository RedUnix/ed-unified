import { contextBridge, ipcRenderer } from 'electron'

// Preload for tool-site WebContentsViews. These views aren't owned by a
// BrowserWindow the way a normal window's webContents is, so Electron can't
// find a parent to anchor native window.alert/confirm/prompt dialogs to --
// they're silently dropped instead of shown. The fix is to replace them with
// versions that ask the main process to show a real dialog anchored to the
// app window.
//
// contextBridge can't overwrite `window.alert` directly (Electron blocks
// binding on top of an existing window property), and assigning to
// `window.alert` from this isolated-world preload wouldn't be visible to the
// page's own main-world scripts anyway. So this only exposes the IPC call;
// WebContentsViewManager injects the actual `window.alert =` reassignment
// into the page's main world via executeJavaScript.
//
// Deliberately not importing IpcChannels from @shared here: this file builds
// as its own preload entry alongside src/preload/index.ts, and Rollup hoists
// any module the two entries both import into a shared chunk. Electron's
// sandboxed preload loader can't require() that extra chunk file, which
// silently breaks the *other* preload (index.ts never runs, so
// window.edToolApp ends up undefined app-wide). Inlining the literal channel
// name keeps this entry standalone. Must match IpcChannels.tabsJsDialog in
// src/shared/ipcChannels.ts.
const TABS_JS_DIALOG_CHANNEL = 'tabs:jsDialog'

contextBridge.exposeInMainWorld('__edToolJsDialogBridge', {
  alert: (message: string): void => {
    ipcRenderer.sendSync(TABS_JS_DIALOG_CHANNEL, { kind: 'alert', message })
  },
  confirm: (message: string): boolean => {
    return ipcRenderer.sendSync(TABS_JS_DIALOG_CHANNEL, { kind: 'confirm', message })
  },
  prompt: (message: string, defaultValue: string): string | null => {
    return ipcRenderer.sendSync(TABS_JS_DIALOG_CHANNEL, { kind: 'prompt', message, defaultValue })
  }
})
