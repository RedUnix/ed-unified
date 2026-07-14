import { useState, type FormEvent } from 'react'
import type { FilesystemToolRecord } from '@shared/types'
import { useLibrary } from '../state/libraryStore'
import CategoryPicker from './CategoryPicker'
import { iconSrc } from '../utils/iconSrc'

interface AddToolModalProps {
  /** When set, the modal edits this tool instead of creating a new one. */
  tool?: FilesystemToolRecord
  onClose: () => void
}

export default function AddToolModal({ tool, onClose }: AddToolModalProps) {
  const { addTool, updateTool, deleteTool } = useLibrary()
  const isEditing = Boolean(tool)
  const [name, setName] = useState(tool?.name ?? '')
  const [description, setDescription] = useState(tool?.description ?? '')
  const [categoryId, setCategoryId] = useState(tool?.categoryIds[0] ?? '')
  const [installedExePath, setInstalledExePath] = useState(tool?.installedExePath ?? '')
  const [iconLocalPath, setIconLocalPath] = useState(tool?.iconLocalPath ?? '')
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
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        categoryIds: categoryId ? [categoryId] : [],
        installedExePath,
        iconLocalPath: iconLocalPath || undefined
      }
      if (tool) {
        await updateTool(tool.id, payload)
      } else {
        await addTool(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!tool) return
    setSubmitting(true)
    try {
      await deleteTool(tool.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal__title">{isEditing ? 'Edit Filesystem Tool' : 'Add Filesystem Tool'}</div>
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
            {iconLocalPath && (
              <button type="button" className="btn" onClick={() => setIconLocalPath('')}>
                Clear
              </button>
            )}
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
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
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--accent" disabled={submitting}>
            {isEditing ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
