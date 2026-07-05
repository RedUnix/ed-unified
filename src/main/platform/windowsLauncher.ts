import { spawn } from 'child_process'

/**
 * Fire-and-forget launch of a local executable, .bat script, or custom-protocol
 * URL (e.g. steam://rungameid/...) on Windows.
 *
 * `shell: true` is required here: Node's spawn() without a shell calls
 * CreateProcess() directly, which only accepts genuine executables -- passing a
 * .bat file (or a URL, which isn't executable at all) fails with `spawn EINVAL`.
 * Routing through cmd.exe lets Windows resolve .bat association and hand off
 * unknown protocols (steam://, com.epicgames.launcher://, http(s)://) to
 * whichever program is registered for them, exactly like typing the same
 * quoted path/URL at a command prompt would.
 */
export function launchPath(path: string): void {
  const child = spawn(`"${path}"`, [], { detached: true, stdio: 'ignore', shell: true })
  child.unref()
}
