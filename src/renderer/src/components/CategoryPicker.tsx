import { useState } from 'react'
import { useLibrary } from '../state/libraryStore'

interface CategoryPickerProps {
  id?: string
  value: string
  onChange: (categoryId: string) => void
}

const NEW_CATEGORY_VALUE = '__new__'

export default function CategoryPicker({ id, value, onChange }: CategoryPickerProps) {
  const { categories, refresh } = useLibrary()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  function handleSelectChange(selected: string): void {
    if (selected === NEW_CATEGORY_VALUE) {
      setAdding(true)
      return
    }
    onChange(selected)
  }

  async function handleCreate(): Promise<void> {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const category = await window.edToolApp.categories.create({ name: newName.trim() })
      await refresh()
      onChange(category.id)
      setAdding(false)
      setNewName('')
    } finally {
      setCreating(false)
    }
  }

  function cancelAdd(): void {
    setAdding(false)
    setNewName('')
  }

  if (adding) {
    return (
      <div className="category-picker__new-row">
        <input
          autoFocus
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleCreate()
            }
            if (e.key === 'Escape') cancelAdd()
          }}
        />
        <button type="button" className="btn" onClick={() => void handleCreate()} disabled={creating}>
          Create
        </button>
        <button type="button" className="btn" onClick={cancelAdd}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <select id={id} value={value} onChange={(e) => handleSelectChange(e.target.value)}>
      <option value="">None</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
      <option value={NEW_CATEGORY_VALUE}>+ New category...</option>
    </select>
  )
}
