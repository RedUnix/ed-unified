import type { BookmarkRecord, FilesystemToolRecord } from '@shared/types'
import BookmarkIcon from './BookmarkIcon'
import {
  ComputerIcon,
  RocketIcon,
  MaximizeIcon,
  RestoreIcon,
  ChevronCollapseIcon,
  ChevronExpandIcon
} from './icons'

interface SidebarProps {
  bookmarks: BookmarkRecord[]
  tools: FilesystemToolRecord[]
  activeSection: 'library' | 'tab' | 'sequences'
  activeTabId: string | null
  collapsed: boolean
  isFullscreen: boolean
  onOpenBookmark: (id: string) => void
  onShowLibrary: () => void
  onShowSequences: () => void
  onLaunchTool: (tool: FilesystemToolRecord) => void
  onToggleCollapsed: () => void
  onToggleFullscreen: () => void
}

export default function Sidebar({
  bookmarks,
  tools,
  activeSection,
  activeTabId,
  collapsed,
  isFullscreen,
  onOpenBookmark,
  onShowLibrary,
  onShowSequences,
  onLaunchTool,
  onToggleCollapsed,
  onToggleFullscreen
}: SidebarProps) {
  function itemClass(isActive: boolean): string {
    return isActive ? 'sidebar__item sidebar__item--active' : 'sidebar__item'
  }

  return (
    <aside className={collapsed ? 'sidebar sidebar--collapsed' : 'sidebar'}>
      <div className="sidebar__brand">{collapsed ? 'EDUA' : 'ED Unified'}</div>
      <button className={itemClass(activeSection === 'library')} onClick={onShowLibrary} title="Library">
        <ComputerIcon />
        {!collapsed && <span>Library</span>}
      </button>
      <button
        className={itemClass(activeSection === 'sequences')}
        onClick={onShowSequences}
        title="Launch Sequences"
      >
        <RocketIcon />
        {!collapsed && <span>Launch Sequences</span>}
      </button>

      {bookmarks.length > 0 && !collapsed && <div className="sidebar__section-label">Bookmarks</div>}
      {bookmarks.map((b) => (
        <button
          key={b.id}
          className={itemClass(activeSection === 'tab' && activeTabId === b.id)}
          onClick={() => onOpenBookmark(b.id)}
          title={b.name}
        >
          <BookmarkIcon baseClass="sidebar__icon" localPath={b.iconLocalPath} remoteUrl={b.iconUrl} siteUrl={b.url} />
          {!collapsed && <span>{b.name}</span>}
        </button>
      ))}

      {tools.length > 0 && !collapsed && <div className="sidebar__section-label">Tools</div>}
      {tools.map((t) => (
        <button key={t.id} className="sidebar__item" onClick={() => onLaunchTool(t)} title={t.name}>
          <BookmarkIcon baseClass="sidebar__icon" localPath={t.iconLocalPath} remoteUrl={t.iconUrl} />
          {!collapsed && <span>{t.name}</span>}
        </button>
      ))}

      <div className="sidebar__spacer" />

      <button className="sidebar__item" onClick={onToggleCollapsed} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? <ChevronExpandIcon /> : <ChevronCollapseIcon />}
        {!collapsed && <span>Collapse</span>}
      </button>
      <button
        className="sidebar__item"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? <RestoreIcon /> : <MaximizeIcon />}
        {!collapsed && <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>}
      </button>
    </aside>
  )
}
