import { launchPath as launchPathWindows } from './windowsLauncher'
import { showNativePrompt as showNativePromptWindows } from './windowsPrompt'

/**
 * Only Windows is implemented for the MVP. Mac/Linux launchers can be added
 * here later without any change to callers (toolsIpc.ts).
 */
export function launchPath(path: string): void {
  if (process.platform === 'win32') {
    launchPathWindows(path)
    return
  }
  throw new Error(`Launching local programs is not yet supported on platform: ${process.platform}`)
}

/** Only Windows is implemented for the MVP; see WebContentsViewManager's window.prompt() override. */
export function showNativePrompt(message: string, defaultValue: string): string | null {
  if (process.platform === 'win32') {
    return showNativePromptWindows(message, defaultValue)
  }
  return null
}
