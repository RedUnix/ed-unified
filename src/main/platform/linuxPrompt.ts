import { execFileSync } from 'child_process'

/**
 * Linux counterpart of windowsPrompt.ts for the window.prompt() override:
 * tries zenity (GNOME and most distros), then kdialog (KDE). Arguments are
 * passed as an argv array, so untrusted page content can't inject shell.
 * Returns null when both are unavailable or the user cancels.
 */
export function showNativePrompt(message: string, defaultValue: string): string | null {
  const attempts: Array<[string, string[]]> = [
    ['zenity', ['--entry', '--title', 'ED Unified', '--text', message, '--entry-text', defaultValue]],
    ['kdialog', ['--title', 'ED Unified', '--inputbox', message, defaultValue]]
  ]
  for (const [command, args] of attempts) {
    try {
      const output = execFileSync(command, args, { encoding: 'utf8' })
      return output.replace(/\n$/, '')
    } catch (err) {
      // Exit code 1 = user cancelled (don't try the next dialog tool);
      // ENOENT = tool not installed (do try the next one).
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') return null
    }
  }
  return null
}
