import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFileSync, readdirSync, readlinkSync } from 'fs'
import { getSettings } from '../data/settingsStore'
import { listTools } from '../data/libraryRepository'

const execFileAsync = promisify(execFile)

const POLL_INTERVAL_MS = 20_000
const GAME_PROCESS_NAMES = ['elitedangerous64.exe', 'elitedangerous32.exe']

interface RunningProcess {
  pid: number
  executablePath: string
  /** First cmdline argument; on Linux this is how Proton/Wine games are identified. */
  commandPath: string
}

let timer: NodeJS.Timeout | null = null
let gameWasRunning = false

/** One CIM query returns every Windows process with its full executable path. */
async function listRunningProcessesWindows(): Promise<RunningProcess[]> {
  const { stdout } = await execFileAsync('powershell', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    'Get-CimInstance Win32_Process | Select-Object ProcessId,ExecutablePath | ConvertTo-Json -Compress'
  ])
  const parsed = JSON.parse(stdout) as Array<{ ProcessId: number; ExecutablePath: string | null }>
  return (Array.isArray(parsed) ? parsed : [parsed])
    .filter((p) => p.ExecutablePath)
    .map((p) => ({
      pid: p.ProcessId,
      executablePath: p.ExecutablePath as string,
      commandPath: p.ExecutablePath as string
    }))
}

/**
 * /proc scan on Linux. The exe symlink covers native tools; the cmdline's
 * first argument is what exposes Proton/Wine processes (their exe link points
 * at wine-preloader, but argv[0] is the Windows .exe path).
 */
function listRunningProcessesLinux(): RunningProcess[] {
  const processes: RunningProcess[] = []
  for (const entry of readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue
    const pid = Number(entry)
    let executablePath = ''
    let commandPath = ''
    try {
      executablePath = readlinkSync(`/proc/${entry}/exe`)
    } catch {
      // Other users' processes -- exe unreadable; cmdline may still work.
    }
    try {
      commandPath = readFileSync(`/proc/${entry}/cmdline`, 'utf-8').split('\0')[0] ?? ''
    } catch {
      // Process exited mid-scan.
    }
    if (executablePath || commandPath) processes.push({ pid, executablePath, commandPath })
  }
  return processes
}

async function listRunningProcesses(): Promise<RunningProcess[]> {
  return process.platform === 'win32' ? listRunningProcessesWindows() : listRunningProcessesLinux()
}

function isGameProcess(proc: RunningProcess): boolean {
  // Separator-agnostic: Proton cmdlines use Windows-style paths (Z:\...\EliteDangerous64.exe).
  return GAME_PROCESS_NAMES.some(
    (name) =>
      proc.executablePath.toLowerCase().endsWith(name) ||
      proc.commandPath.toLowerCase().endsWith(name)
  )
}

/**
 * Kills every running process whose executable is one of the library's
 * installed tools. Matching by path (rather than launch-time PID tracking)
 * also covers tools started via launch-sequence .bat files, whose `start`
 * steps detach from any process tree we could follow.
 */
async function closeCompanionTools(processes: RunningProcess[]): Promise<void> {
  const tools = await listTools()
  const toolPaths = new Set(
    tools.map((t) => t.installedExePath?.toLowerCase()).filter((p): p is string => Boolean(p))
  )
  for (const proc of processes) {
    const matches =
      toolPaths.has(proc.executablePath.toLowerCase()) ||
      toolPaths.has(proc.commandPath.toLowerCase())
    if (!matches) continue
    try {
      if (process.platform === 'win32') {
        await execFileAsync('taskkill', ['/PID', String(proc.pid), '/T', '/F'])
      } else {
        process.kill(proc.pid, 'SIGTERM')
      }
      console.log(`Auto-closed companion tool (pid ${proc.pid}): ${proc.executablePath || proc.commandPath}`)
    } catch {
      // Already exited, or access denied (e.g. elevated process) -- skip.
    }
  }
}

async function poll(): Promise<void> {
  if (!getSettings().autoCloseToolsOnGameExit) {
    gameWasRunning = false
    return
  }
  let processes: RunningProcess[]
  try {
    processes = await listRunningProcesses()
  } catch {
    return
  }
  const gameRunning = processes.some(isGameProcess)
  if (gameWasRunning && !gameRunning) {
    await closeCompanionTools(processes)
  }
  gameWasRunning = gameRunning
}

/** Watches for Elite Dangerous exiting; polls only do work while the setting is enabled. */
export function startGameWatcher(): void {
  if ((process.platform !== 'win32' && process.platform !== 'linux') || timer) return
  timer = setInterval(() => void poll(), POLL_INTERVAL_MS)
}

export function stopGameWatcher(): void {
  if (timer) clearInterval(timer)
  timer = null
  gameWasRunning = false
}
