import type { FilesystemToolRecord, LaunchSequenceRecord } from '@shared/types'

export interface BuiltBatScript {
  script: string
  launchableCount: number
  skippedCount: number
}

/**
 * Builds a Windows .bat script that launches each step in order, waiting
 * `delaySeconds` between steps. Uses `ping 127.0.0.1 -n {N+1} >nul` rather than
 * `timeout /t N`: `timeout` fails with "Input redirection is not supported" when
 * stdin isn't an interactive TTY, which is exactly the case when this app spawns
 * the .bat via `child_process.spawn(..., { stdio: 'ignore' })`. `ping` has no such
 * requirement and is the standard portable delay idiom for generated batch files.
 * The first ping response is immediate, so N+1 pings are needed for an N-second wait.
 *
 * Tool steps are skipped (with a `rem` comment noting why) if the referenced tool
 * has no `installedExePath` set yet -- this is surfaced to the caller via
 * `skippedCount` so the UI can warn instead of silently producing a no-op script.
 * URL steps (Steam/Epic/other custom-protocol launches) are never skipped --
 * `start "" "<url>"` hands off to whatever OS-registered handler owns that scheme.
 */
export function buildBatScript(
  sequence: LaunchSequenceRecord,
  tools: FilesystemToolRecord[]
): BuiltBatScript {
  const lines = ['@echo off']
  let launchableCount = 0
  let skippedCount = 0

  for (const step of sequence.steps) {
    let target: string | undefined

    if (step.kind === 'tool') {
      const tool = tools.find((t) => t.id === step.toolId)
      if (!tool?.installedExePath) {
        lines.push(`rem Skipped step: tool "${tool?.name ?? step.toolId}" has no launch program set`)
        skippedCount += 1
        continue
      }
      target = tool.installedExePath
    } else {
      target = step.url
    }

    lines.push(`start "" "${target}"`)
    launchableCount += 1
    const delay = Math.round(step.delaySeconds)
    if (delay > 0) {
      lines.push(`ping 127.0.0.1 -n ${delay + 1} >nul`)
    }
  }

  return { script: lines.join('\r\n') + '\r\n', launchableCount, skippedCount }
}
