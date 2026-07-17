import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs'
import type { FilesystemToolRecord, LaunchSequenceRecord } from '@shared/types'
import { buildBatScript } from './windowsBatBuilder'

function sequencesDir(): string {
  const dir = join(app.getPath('userData'), 'sequences')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/** Escapes a value for use inside double quotes in a POSIX shell script. */
function shellQuote(value: string): string {
  return `"${value.replace(/[\\"$`]/g, '\\$&')}"`
}

interface BuiltScript {
  script: string
  launchableCount: number
  skippedCount: number
}

/**
 * POSIX-shell equivalent of the Windows .bat builder: tools launch detached
 * via nohup, URL steps (steam:// etc.) go through the desktop handler
 * (xdg-open / open), and delays use plain `sleep`.
 */
function buildShellScript(
  sequence: LaunchSequenceRecord,
  tools: FilesystemToolRecord[]
): BuiltScript {
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open'
  const lines = ['#!/usr/bin/env bash']
  let launchableCount = 0
  let skippedCount = 0

  for (const step of sequence.steps) {
    if (step.kind === 'tool') {
      const tool = tools.find((t) => t.id === step.toolId)
      if (!tool?.installedExePath) {
        lines.push(`# Skipped step: tool "${tool?.name ?? step.toolId}" has no launch program set`)
        skippedCount += 1
        continue
      }
      lines.push(`nohup ${shellQuote(tool.installedExePath)} >/dev/null 2>&1 &`)
    } else {
      lines.push(`${opener} ${shellQuote(step.url)} >/dev/null 2>&1 &`)
    }
    launchableCount += 1
    const delay = Math.round(step.delaySeconds)
    if (delay > 0) lines.push(`sleep ${delay}`)
  }

  return { script: lines.join('\n') + '\n', launchableCount, skippedCount }
}

/**
 * Writes the sequence's launch script (.bat on Windows, executable .sh
 * elsewhere) to userData/sequences/<id>.<ext> and returns the path. Throws if
 * every step was skipped, so callers see a clear error instead of a
 * silently-generated no-op script.
 */
export function writeSequenceScript(
  sequence: LaunchSequenceRecord,
  tools: FilesystemToolRecord[]
): string {
  const isWindows = process.platform === 'win32'
  const built = isWindows ? buildBatScript(sequence, tools) : buildShellScript(sequence, tools)
  if (built.launchableCount === 0) {
    throw new Error(
      'None of the steps in this sequence can be launched yet. For tool steps, open the tool in your Library and set its program via "Locate Program" first.'
    )
  }
  const filePath = join(sequencesDir(), `${sequence.id}.${isWindows ? 'bat' : 'sh'}`)
  // Plain UTF-8, no BOM: writeFileSync doesn't add one by default, and cmd.exe on
  // older Windows versions can choke on BOM-prefixed .bat files.
  writeFileSync(filePath, built.script, { encoding: 'utf-8', mode: 0o755 })
  return filePath
}

export function deleteSequenceScript(scriptPath: string | undefined): void {
  if (!scriptPath) return
  rmSync(scriptPath, { force: true })
}
