import { useState, type FormEvent } from 'react'
import type { LaunchSequenceRecord, LaunchSequenceStep } from '@shared/types'
import { useLibrary } from '../state/libraryStore'

interface SequenceEditorModalProps {
  sequence?: LaunchSequenceRecord
  onClose: () => void
}

const ELITE_DANGEROUS_STEAM_URL = 'steam://rungameid/359320'

export default function SequenceEditorModal({ sequence, onClose }: SequenceEditorModalProps) {
  const { tools, addSequence, updateSequence, deleteSequence } = useLibrary()
  const isEditing = Boolean(sequence)
  const [name, setName] = useState(sequence?.name ?? '')
  const [steps, setSteps] = useState<LaunchSequenceStep[]>(sequence?.steps ?? [])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [busyAction, setBusyAction] = useState<'generate' | 'run' | null>(null)
  const [savedBatPath, setSavedBatPath] = useState<string | null>(sequence?.batFilePath ?? null)
  const [runNotice, setRunNotice] = useState<string | null>(null)

  const launchableTools = tools.filter((t) => t.installedExePath)
  const toolsMissingPath = tools.length - launchableTools.length

  function stepLabel(step: LaunchSequenceStep): string {
    if (step.kind === 'url') return step.label
    return tools.find((t) => t.id === step.toolId)?.name ?? '(removed tool)'
  }

  function addToolStep(toolId: string): void {
    setSteps((prev) => [...prev, { kind: 'tool', toolId, delaySeconds: 5 }])
  }

  function addUrlStep(label: string, url: string): void {
    setSteps((prev) => [...prev, { kind: 'url', label, url, delaySeconds: 5 }])
  }

  function addCustomUrlStep(): void {
    const url = window.prompt('Launch URL (e.g. steam://rungameid/<appid> or an Epic com.epicgames.launcher://... URL):')
    if (!url) return
    const label = window.prompt('Label for this step:', 'Custom Launch') ?? 'Custom Launch'
    addUrlStep(label, url)
  }

  function removeStep(index: number): void {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  function moveStep(index: number, direction: -1 | 1): void {
    setSteps((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  function setStepDelay(index: number, delaySeconds: number): void {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, delaySeconds } : s)))
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (steps.length === 0) {
      setError('Add at least one step to the sequence.')
      return
    }
    setSubmitting(true)
    try {
      if (sequence) {
        await updateSequence(sequence.id, { name: name.trim(), steps })
      } else {
        await addSequence({ name: name.trim(), steps })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!sequence) return
    setSubmitting(true)
    try {
      await deleteSequence(sequence.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  async function handleGenerateBat(): Promise<void> {
    if (!sequence) return
    setBusyAction('generate')
    setError(null)
    setRunNotice(null)
    try {
      const updated = await window.edToolApp.sequences.generateBat(sequence.id)
      setSavedBatPath(updated.batFilePath ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyAction(null)
    }
  }

  async function handleRunNow(): Promise<void> {
    if (!sequence) return
    setBusyAction('run')
    setError(null)
    setRunNotice(null)
    try {
      await window.edToolApp.sequences.runNow(sequence.id)
      setRunNotice('Launched.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyAction(null)
    }
  }

  async function handleRevealBat(): Promise<void> {
    if (!sequence) return
    try {
      await window.edToolApp.sequences.revealBat(sequence.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        style={{ width: 560 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal__title">{isEditing ? 'Edit Launch Sequence' : 'New Launch Sequence'}</div>
        <div className="field">
          <label htmlFor="seq-name">Name</label>
          <input id="seq-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="sidebar__section-label" style={{ padding: 0, marginBottom: 6 }}>
              Available Tools
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
              {launchableTools.length === 0 && (
                <div className="error-text" style={{ color: 'var(--text-faint)' }}>
                  No tools with a launch program set yet.
                </div>
              )}
              {launchableTools.map((t) => (
                <button key={t.id} type="button" className="btn" onClick={() => addToolStep(t.id)}>
                  + {t.name}
                </button>
              ))}
            </div>
            {toolsMissingPath > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                {toolsMissingPath} tool{toolsMissingPath === 1 ? '' : 's'} in your library {toolsMissingPath === 1 ? "isn't" : "aren't"} shown here --
                open it in the Library and use &quot;Locate Program&quot; to set its launch path first.
              </div>
            )}

            <div className="sidebar__section-label" style={{ padding: 0, marginTop: 14, marginBottom: 6 }}>
              Games
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                type="button"
                className="btn"
                onClick={() => addUrlStep('Elite Dangerous (Steam)', ELITE_DANGEROUS_STEAM_URL)}
              >
                + Elite Dangerous (Steam)
              </button>
              <button type="button" className="btn" onClick={addCustomUrlStep}>
                + Custom Launch URL (Epic, other)...
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div className="sidebar__section-label" style={{ padding: 0, marginBottom: 6 }}>
              Sequence Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
              {steps.length === 0 && (
                <div className="error-text" style={{ color: 'var(--text-faint)' }}>
                  Click a tool or game on the left to add it.
                </div>
              )}
              {steps.map((step, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button type="button" className="btn" onClick={() => moveStep(index, -1)} disabled={index === 0}>
                    ▲
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => moveStep(index, 1)}
                    disabled={index === steps.length - 1}
                  >
                    ▼
                  </button>
                  <span style={{ flex: 1, fontSize: 12 }}>{stepLabel(step)}</span>
                  <input
                    type="number"
                    min={0}
                    value={step.delaySeconds}
                    onChange={(e) => setStepDelay(index, Number(e.target.value))}
                    style={{
                      width: 56,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      padding: '4px 6px',
                      fontSize: 12
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>sec</span>
                  <button type="button" className="btn btn--danger" onClick={() => removeStep(index)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}
        {runNotice && <div style={{ fontSize: 12, color: 'var(--success)' }}>{runNotice}</div>}
        {savedBatPath && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Saved: {savedBatPath}
            </span>
            <button type="button" className="btn" onClick={() => void handleRevealBat()} style={{ flexShrink: 0 }}>
              Reveal in Folder
            </button>
          </div>
        )}

        <div className="modal__actions">
          {isEditing && (
            <button
              type="button"
              className="btn btn--danger"
              style={{ marginRight: 'auto' }}
              onClick={() => void handleDelete()}
              disabled={submitting}
            >
              Delete
            </button>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => void handleGenerateBat()}
                disabled={busyAction !== null}
              >
                {busyAction === 'generate' ? 'Generating...' : 'Generate Launch Script'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => void handleRunNow()}
                disabled={busyAction !== null}
              >
                {busyAction === 'run' ? 'Running...' : 'Run Now'}
              </button>
            </>
          )}
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--accent" disabled={submitting}>
            {isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
