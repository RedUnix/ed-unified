import { useState } from 'react'
import type { LaunchSequenceRecord } from '@shared/types'
import { useLibrary } from '../state/libraryStore'
import SequenceEditorModal from './SequenceEditorModal'
import PanelBackground from './PanelBackground'

type ModalTarget = 'new' | LaunchSequenceRecord | null

export default function SequencesPanel() {
  const { launchSequences } = useLibrary()
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)
  const [runningId, setRunningId] = useState<string | null>(null)

  async function handleRunNow(id: string): Promise<void> {
    setRunningId(id)
    try {
      await window.edToolApp.sequences.runNow(id)
    } finally {
      setRunningId(null)
    }
  }

  return (
    <div className="library-grid">
      <PanelBackground />
      <div className="library-grid__toolbar">
        <div className="library-grid__title">Launch Sequences</div>
        <div className="library-grid__actions">
          <button className="btn btn--accent" onClick={() => setModalTarget('new')}>
            New Sequence
          </button>
        </div>
      </div>

      {launchSequences.length === 0 && (
        <div className="empty-state">
          No launch sequences yet -- create one to batch-launch your tools with delays between each.
        </div>
      )}

      <div className="grid">
        {launchSequences.map((seq) => (
          <div className="card" key={seq.id}>
            <div className="card__header">
              <div className="card__name">{seq.name}</div>
            </div>
            <div className="card__description">
              {seq.steps.length} step{seq.steps.length === 1 ? '' : 's'}
            </div>
            <div className="card__actions">
              <button
                className="btn btn--accent"
                onClick={() => void handleRunNow(seq.id)}
                disabled={runningId === seq.id}
              >
                {runningId === seq.id ? 'Running...' : 'Run Now'}
              </button>
              <button className="btn" onClick={() => setModalTarget(seq)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalTarget && (
        <SequenceEditorModal
          sequence={modalTarget === 'new' ? undefined : modalTarget}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  )
}
