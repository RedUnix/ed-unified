import { useState, type FormEvent } from 'react'
import { useLibrary } from '../state/libraryStore'
import CategoryPicker from './CategoryPicker'
import { iconSrc } from '../utils/iconSrc'

interface AddToolModalProps {
  onClose: () => void
}

export default function AddToolModal({ onClose }: AddToolModalProps) {
  const { addTool } = useLibrary()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [installedExePath, setInstalledExePath] = useState('')
  const [iconLocalPath, setIconLocalPath] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function pickInstalledExe(): Promise<void> {
    const path = await window.edToolApp.tools.pickInstalledExe()
    if (path) setInstalledExePath(path)
  }

  async function pickIcon(): Promise<void> {
    const path = await window.edToolApp.tools.pickIconFile()
    if (path) setIconLocalPath(path)
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!installedExePath) {
      setError('Pick the program to launch.')
      return
    }
    setSubmitting(true)
    try {
      await addTool({
        name: name.trim(),
        description: description.trim() || undefined,
        categoryIds: categoryId ? [categoryId] : [],
        installedExePath,
        iconLocalPath: iconLocalPath || undefined
      })
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
        <div className="modal__title">Add Filesystem Tool</div>
        <div className="field">
          <label htmlFor="tool-name">Name</label>
          <input id="tool-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="tool-desc">Description (optional)</label>
          <textarea
            id="tool-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="field">
          <label htmlFor="tool-cat">Category</label>
          <CategoryPicker id="tool-cat" value={categoryId} onChange={setCategoryId} />
        </div>
        <div className="field">
          <label>Program to launch</label>
          <button type="button" className="btn" onClick={pickInstalledExe}>
            {installedExePath ? installedExePath : 'Browse...'}
          </button>
        </div>
        <div className="field">
          <label>Icon (optional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {iconLocalPath && (
              <img className="card__icon" src={iconSrc(iconLocalPath)} alt="" style={{ width: 28, height: 28 }} />
            )}
            <button type="button" className="btn" onClick={pickIcon}>
              {iconLocalPath ? 'Change icon...' : 'Choose icon...'}
            </button>
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--accent" disabled={submitting}>
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
