import { spawn } from 'child_process'
import { shell } from 'electron'
import { launchPath as launchPathWindows } from './windowsLauncher'
import { showNativePrompt as showNativePromptWindows } from './windowsPrompt'

/**
 * Fire-and-forget launch of a local program or custom-protocol URL. Windows
 * routes through cmd.exe (see windowsLauncher.ts); on Linux/macOS, protocol
 * URLs (steam:// etc.) go to the OS handler and plain paths are spawned
 * directly.
 */
export function launchPath(path: string): void {
  if (process.platform === 'win32') {
    launchPathWindows(path)
    return
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) {
    void shell.openExternal(path)
    return
  }
  const child = spawn(path, [], { detached: true, stdio: 'ignore' })
  child.unref()
}

/** Only Windows has a native prompt implementation; see WebContentsViewManager's window.prompt() override. */
export function showNativePrompt(message: string, defaultValue: string): string | null {
  if (process.platform === 'win32') {
    return showNativePromptWindows(message, defaultValue)
  }
  return null
}
