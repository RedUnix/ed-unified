import { useState, type FormEvent } from 'react'
import type { BookmarkRecord } from '@shared/types'
import { useLibrary } from '../state/libraryStore'
import CategoryPicker from './CategoryPicker'
import { iconSrc } from '../utils/iconSrc'

interface BookmarkFormModalProps {
  bookmark?: BookmarkRecord
  onClose: () => void
}

export default function BookmarkFormModal({ bookmark, onClose }: BookmarkFormModalProps) {
  const { addBookmark, updateBookmark, deleteBookmark } = useLibrary()
  const isEditing = Boolean(bookmark)
  const [name, setName] = useState(bookmark?.name ?? '')
  const [url, setUrl] = useState(bookmark?.url ?? '')
  const [iconUrl, setIconUrl] = useState(bookmark?.iconUrl ?? '')
  const [iconLocalPath, setIconLocalPath] = useState(bookmark?.iconLocalPath ?? '')
  const [description, setDescription] = useState(bookmark?.description ?? '')
  const [categoryId, setCategoryId] = useState(bookmark?.categoryIds[0] ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        url: url.trim(),
        iconUrl: iconUrl.trim() || undefined,
        iconLocalPath: iconLocalPath || undefined,
        description: description.trim() || undefined,
        categoryIds: categoryId ? [categoryId] : []
      }
      if (bookmark) {
        await updateBookmark(bookmark.id, payload)
      } else {
        await addBookmark(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!bookmark) return
    setSubmitting(true)
    try {
      await deleteBookmark(bookmark.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal__title">{isEditing ? 'Edit Bookmark' : 'Add Bookmark'}</div>
        <div className="field">
          <label htmlFor="bm-name">Name</label>
          <input id="bm-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="bm-url">URL</label>
          <input
            id="bm-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="field">
          <label htmlFor="bm-icon">Icon (optional) -- URL or local image file</label>
          <input
            id="bm-icon"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="https://example.com/icon.png"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            {iconLocalPath && (
              <img
                className="card__icon card__icon--has-image"
                src={iconSrc(iconLocalPath)}
                alt=""
                style={{ width: 28, height: 28 }}
              />
            )}
            <button
              type="button"
              className="btn"
              onClick={() =>
                void window.edToolApp.tools.pickIconFile().then((path) => {
                  if (path) setIconLocalPath(path)
                })
              }
            >
              {iconLocalPath ? 'Change local file...' : 'Choose local file...'}
            </button>
            {iconLocalPath && (
              <button type="button" className="btn" onClick={() => setIconLocalPath('')}>
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="field">
          <label htmlFor="bm-desc">Description (optional)</label>
          <textarea
            id="bm-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="field">
          <label htmlFor="bm-cat">Category</label>
          <CategoryPicker id="bm-cat" value={categoryId} onChange={setCategoryId} />
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
