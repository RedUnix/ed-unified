import { useEffect, useMemo, useState, type DragEvent } from 'react'
import type { AppSettings, BookmarkRecord, FilesystemToolRecord } from '@shared/types'
import { useLibrary } from '../state/libraryStore'
import { iconSrc } from '../utils/iconSrc'
import BookmarkFormModal from './BookmarkFormModal'
import AddToolModal from './AddToolModal'
import EdcodexImportModal from './EdcodexImportModal'
import AppSettingsControl from './AppSettingsControl'
import BookmarkIcon from './BookmarkIcon'
import { applyThemeColors } from '../utils/applyThemeColors'

interface LibraryGridProps {
  onOpenBookmark: (id: string) => void
  onToolAction: (tool: FilesystemToolRecord) => void
  onOpenUrl: (url: string) => void
}

type BookmarkModalTarget = 'new' | BookmarkRecord | null
type ToolModalTarget = 'new' | FilesystemToolRecord | null
type KindFilter = 'all' | 'website' | 'filesystem-tool'

type GridItem = { kind: 'website'; record: BookmarkRecord } | { kind: 'filesystem-tool'; record: FilesystemToolRecord }

export default function LibraryGrid({ onOpenBookmark, onToolAction, onOpenUrl }: LibraryGridProps) {
  const { bookmarks, tools, categories, reorderLibraryItems, loading, refresh } = useLibrary()
  const [edcodexModalOpen, setEdcodexModalOpen] = useState(false)
  const [bookmarkModalTarget, setBookmarkModalTarget] = useState<BookmarkModalTarget>(null)
  const [toolModalTarget, setToolModalTarget] = useState<ToolModalTarget>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    void window.edToolApp.settings.get().then((s) => {
      setSettings(s)
      applyThemeColors(s.themeColors)
    })
    // Main-initiated changes (e.g. the screenshot watcher swapping the
    // background) stream in over settings:changed.
    const unsubscribe = window.edToolApp.settings.onChanged(setSettings)
    return unsubscribe
  }, [])

  async function handleToolUpdateBadge(tool: FilesystemToolRecord): Promise<void> {
    if (tool.source.edcodexUrl) onOpenUrl(tool.source.edcodexUrl)
    await window.edToolApp.toolUpdates.acknowledge(tool.id)
    await refresh()
  }

  function handleSettingsChange(updated: AppSettings): void {
    setSettings(updated)
    applyThemeColors(updated.themeColors)
  }

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories) map.set(c.id, c.name)
    return map
  }, [categories])

  const gridItems = useMemo<GridItem[]>(() => {
    const items: GridItem[] = [
      ...bookmarks.map((record) => ({ kind: 'website' as const, record })),
      ...tools.map((record) => ({ kind: 'filesystem-tool' as const, record }))
    ]
    return items.sort((a, b) => a.record.order - b.record.order)
  }, [bookmarks, tools])

  const filtersActive = kindFilter !== 'all' || categoryFilter !== ''
  const visibleItems = useMemo(
    () =>
      gridItems.filter(
        (item) =>
          (kindFilter === 'all' || item.kind === kindFilter) &&
          (categoryFilter === '' || item.record.categoryIds.includes(categoryFilter))
      ),
    [gridItems, kindFilter, categoryFilter]
  )

  const isEmpty = !loading && bookmarks.length === 0 && tools.length === 0

  function handleDragStart(e: DragEvent, id: string): void {
    // Chromium requires dataTransfer.setData in dragstart for the drop to be
    // considered valid -- without it the drag ghost snaps back to its origin
    // on release instead of completing the drop, even though onDrop's own
    // logic would otherwise run fine.
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedId(id)
  }

  function handleDragOver(e: DragEvent, id: string): void {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggedId) setDragOverId(id)
  }

  function handleDragEnd(): void {
    setDraggedId(null)
    setDragOverId(null)
  }

  function handleDrop(e: DragEvent, targetId: string): void {
    e.preventDefault()
    const sourceId = draggedId
    setDraggedId(null)
    setDragOverId(null)
    if (!sourceId || sourceId === targetId) return
    const ids = gridItems.map((item) => item.record.id)
    const fromIndex = ids.indexOf(sourceId)
    const toIndex = ids.indexOf(targetId)
    if (fromIndex === -1 || toIndex === -1) return
    const reordered = [...ids]
    reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, sourceId)
    void reorderLibraryItems(reordered)
  }

  function cardClass(id: string): string {
    let className = 'card'
    if (id === draggedId) className += ' card--dragging'
    if (id === dragOverId) className += ' card--drag-over'
    return className
  }

  return (
    <div className="library-grid">
      {settings?.libraryBackgroundPath && (
        <div
          className="library-grid__background"
          style={{
            backgroundImage: `url(${iconSrc(settings.libraryBackgroundPath)})`,
            opacity: settings.libraryBackgroundOpacity
          }}
        />
      )}
      <div className="library-grid__toolbar">
        <div className="library-grid__title">Library</div>
        <div className="library-grid__actions">
          <AppSettingsControl settings={settings} onSettingsChange={handleSettingsChange} />
          <button className="btn" onClick={() => setEdcodexModalOpen(true)}>
            Import from EDCodex
          </button>
          <button className="btn" onClick={() => setToolModalTarget('new')}>
            Add Tool
          </button>
          <button className="btn" onClick={() => setBookmarkModalTarget('new')}>
            Add Bookmark
          </button>
        </div>
      </div>

      <div className="library-grid__filters">
        <div className="filter-group">
          {(
            [
              ['all', 'All'],
              ['website', 'Bookmarks'],
              ['filesystem-tool', 'Tools']
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              className={kindFilter === value ? 'btn btn--toggle-active' : 'btn'}
              onClick={() => setKindFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button
            className="btn"
            onClick={() => {
              setKindFilter('all')
              setCategoryFilter('')
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {isEmpty && (
        <div className="empty-state">
          Nothing here yet -- add a bookmark, add a filesystem tool, or import one from EDCodex.
        </div>
      )}

      {!isEmpty && !loading && filtersActive && visibleItems.length === 0 && (
        <div className="empty-state">Nothing matches the current filters.</div>
      )}

      <div className="grid">
        {visibleItems.map((item) => {
          const { record } = item
          return (
            <div
              className={cardClass(record.id)}
              key={record.id}
              draggable
              onDragStart={(e) => handleDragStart(e, record.id)}
              onDragOver={(e) => handleDragOver(e, record.id)}
              onDragLeave={() => setDragOverId((current) => (current === record.id ? null : current))}
              onDrop={(e) => handleDrop(e, record.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="card__header">
                <BookmarkIcon
                  baseClass="card__icon"
                  localPath={record.iconLocalPath}
                  remoteUrl={record.iconUrl}
                  siteUrl={item.kind === 'website' ? item.record.url : undefined}
                />
                <div className="card__name">{record.name}</div>
                {item.kind === 'filesystem-tool' && item.record.updateAvailable && (
                  <button
                    className="card__update-badge"
                    title="A newer version is listed on EDCodex -- click to view (and clear this badge)"
                    onClick={() => void handleToolUpdateBadge(item.record)}
                  >
                    Update
                  </button>
                )}
              </div>
              {record.description && <div className="card__description">{record.description}</div>}
              <div className="card__categories">
                {record.categoryIds.map((id) => (
                  <span className="chip" key={id}>
                    {categoryNameById.get(id) ?? id}
                  </span>
                ))}
              </div>
              <div className="card__actions">
                {item.kind === 'website' ? (
                  <>
                    <button className="btn btn--accent" onClick={() => onOpenBookmark(item.record.id)}>
                      Open
                    </button>
                    <button className="btn" onClick={() => setBookmarkModalTarget(item.record)}>
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn--accent" onClick={() => onToolAction(item.record)}>
                      {item.record.installedExePath ? 'Launch' : 'Locate Program...'}
                    </button>
                    <button className="btn" onClick={() => setToolModalTarget(item.record)}>
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {bookmarkModalTarget && (
        <BookmarkFormModal
          bookmark={bookmarkModalTarget === 'new' ? undefined : bookmarkModalTarget}
          onClose={() => setBookmarkModalTarget(null)}
        />
      )}
      {toolModalTarget && (
        <AddToolModal
          tool={toolModalTarget === 'new' ? undefined : toolModalTarget}
          onClose={() => setToolModalTarget(null)}
        />
      )}
      {edcodexModalOpen && <EdcodexImportModal onClose={() => setEdcodexModalOpen(false)} />}
    </div>
  )
}
