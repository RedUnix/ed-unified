import { useState, type FormEvent } from 'react'
import { useLibrary } from '../state/libraryStore'

interface EdcodexImportModalProps {
  onClose: () => void
}

export default function EdcodexImportModal({ onClose }: EdcodexImportModalProps) {
  const { importFromEdcodexUrl } = useLibrary()
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    if (!url.trim()) {
      setError('Paste an edcodex.info tool page URL.')
      return
    }
    setSubmitting(true)
    try {
      await importFromEdcodexUrl(url.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal__title">Import from EDCodex</div>
        <div className="field">
          <label htmlFor="edcodex-url">Tool page URL</label>
          <input
            id="edcodex-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://edcodex.info/?m=tools&entry=631"
            autoFocus
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--accent" disabled={submitting}>
            {submitting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </form>
    </div>
  )
}
