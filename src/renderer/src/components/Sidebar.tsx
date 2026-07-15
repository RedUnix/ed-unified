import { useState } from 'react'
import type { BookmarkRecord, FilesystemToolRecord, UpdateCheckResult } from '@shared/types'
import BookmarkIcon from './BookmarkIcon'
import {
  ComputerIcon,
  RocketIcon,
  DownloadIcon,
  MaximizeIcon,
  RestoreIcon,
  ChevronCollapseIcon,
  ChevronExpandIcon
} from './icons'

interface SidebarProps {
  bookmarks: BookmarkRecord[]
  tools: FilesystemToolRecord[]
  activeSection: 'library' | 'tab' | 'sequences' | 'downloads'
  activeTabId: string | null
  collapsed: boolean
  isFullscreen: boolean
  activeDownloadCount: number
  onOpenBookmark: (id: string) => void
  onShowLibrary: () => void
  onShowSequences: () => void
  onShowDownloads: () => void
  onLaunchTool: (tool: FilesystemToolRecord) => void
  onToggleCollapsed: () => void
  onToggleFullscreen: () => void
  updateInfo: UpdateCheckResult | null
  onOpenReleasePage: () => void
}

export default function Sidebar({
  bookmarks,
  tools,
  activeSection,
  activeTabId,
  collapsed,
  isFullscreen,
  activeDownloadCount,
  onOpenBookmark,
  onShowLibrary,
  onShowSequences,
  onShowDownloads,
  onLaunchTool,
  onToggleCollapsed,
  onToggleFullscreen,
  updateInfo,
  onOpenReleasePage
}: SidebarProps) {
  const [updateDismissed, setUpdateDismissed] = useState(false)

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
      <button
        className={itemClass(activeSection === 'downloads')}
        onClick={onShowDownloads}
        title="Downloads"
      >
        <DownloadIcon />
        {!collapsed && <span>Downloads</span>}
        {activeDownloadCount > 0 && (
          <span className="sidebar__badge">{activeDownloadCount}</span>
        )}
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

      {updateInfo?.available && !updateDismissed && (
        <div className="sidebar__update-banner" title={`Update available: v${updateInfo.latestVersion}`}>
          <button className="sidebar__update-link" onClick={onOpenReleasePage}>
            {collapsed ? '⇧' : `Update available: v${updateInfo.latestVersion}`}
          </button>
          {!collapsed && (
            <button
              className="sidebar__update-dismiss"
              onClick={() => setUpdateDismissed(true)}
              title="Dismiss"
            >
              &times;
            </button>
          )}
        </div>
      )}

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
