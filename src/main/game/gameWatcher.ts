import { execFile } from 'child_process'
import { promisify } from 'util'
import { getSettings } from '../data/settingsStore'
import { listTools } from '../data/libraryRepository'

const execFileAsync = promisify(execFile)

const POLL_INTERVAL_MS = 20_000
const GAME_PROCESS_NAMES = ['elitedangerous64.exe', 'elitedangerous32.exe']

interface RunningProcess {
  pid: number
  executablePath: string
}

let timer: NodeJS.Timeout | null = null
let gameWasRunning = false

/** One CIM query returns every process with its full executable path. */
async function listRunningProcesses(): Promise<RunningProcess[]> {
  const { stdout } = await execFileAsync('powershell', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    'Get-CimInstance Win32_Process | Select-Object ProcessId,ExecutablePath | ConvertTo-Json -Compress'
  ])
  const parsed = JSON.parse(stdout) as Array<{ ProcessId: number; ExecutablePath: string | null }>
  return (Array.isArray(parsed) ? parsed : [parsed])
    .filter((p) => p.ExecutablePath)
    .map((p) => ({ pid: p.ProcessId, executablePath: p.ExecutablePath as string }))
}

function isGameProcess(proc: RunningProcess): boolean {
  const exe = proc.executablePath.toLowerCase()
  return GAME_PROCESS_NAMES.some((name) => exe.endsWith(`\\${name}`))
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
    if (!toolPaths.has(proc.executablePath.toLowerCase())) continue
    try {
      await execFileAsync('taskkill', ['/PID', String(proc.pid), '/T', '/F'])
      console.log(`Auto-closed companion tool (pid ${proc.pid}): ${proc.executablePath}`)
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
  if (process.platform !== 'win32' || timer) return
  timer = setInterval(() => void poll(), POLL_INTERVAL_MS)
}

export function stopGameWatcher(): void {
  if (timer) clearInterval(timer)
  timer = null
  gameWasRunning = false
}
