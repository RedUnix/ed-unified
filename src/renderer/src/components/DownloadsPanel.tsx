import type { DownloadRecord } from '@shared/types'

interface DownloadsPanelProps {
  downloads: DownloadRecord[]
  onClearFinished: () => void
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** i
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}

function formatEta(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${seconds}s`
}

const STATE_LABELS: Record<DownloadRecord['state'], string> = {
  progressing: 'Downloading',
  completed: 'Completed',
  cancelled: 'Cancelled',
  interrupted: 'Failed'
}

export default function DownloadsPanel({ downloads, onClearFinished }: DownloadsPanelProps) {
  const hasFinished = downloads.some((d) => d.state !== 'progressing')

  return (
    <div className="downloads-panel">
      <div className="library-grid__toolbar">
        <div className="library-grid__title">Downloads</div>
        <div className="library-grid__actions">
          {hasFinished && (
            <button className="btn" onClick={onClearFinished}>
              Clear Finished
            </button>
          )}
        </div>
      </div>

      {downloads.length === 0 && (
        <div className="empty-state">
          No downloads yet -- files you download from embedded sites will show up here.
        </div>
      )}

      {downloads.map((d) => {
        const percent =
          d.totalBytes > 0 ? Math.min(100, (d.receivedBytes / d.totalBytes) * 100) : null
        return (
          <div className="download-row" key={d.id}>
            <div className="download-row__header">
              <span className="download-row__name" title={d.savePath}>
                {d.filename}
              </span>
              <span
                className={
                  d.state === 'interrupted' || d.state === 'cancelled'
                    ? 'download-row__state download-row__state--error'
                    : 'download-row__state'
                }
              >
                {STATE_LABELS[d.state]}
              </span>
            </div>

            {d.state === 'progressing' && (
              <div className="download-row__progress">
                <div
                  className={
                    percent === null
                      ? 'download-row__bar download-row__bar--indeterminate'
                      : 'download-row__bar'
                  }
                  style={percent === null ? undefined : { width: `${percent}%` }}
                />
              </div>
            )}

            <div className="download-row__meta">
              <span>
                {formatBytes(d.receivedBytes)}
                {d.totalBytes > 0 && ` / ${formatBytes(d.totalBytes)}`}
              </span>
              {d.state === 'progressing' && d.bytesPerSecond > 0 && (
                <span>{formatBytes(d.bytesPerSecond)}/s</span>
              )}
              {d.state === 'progressing' && d.etaSeconds !== null && (
                <span>{formatEta(d.etaSeconds)} left</span>
              )}
              <button
                className="download-row__folder"
                title="Show in folder"
                onClick={() => void window.edToolApp.downloads.showInFolder(d.id)}
              >
                {d.directory}
              </button>
            </div>

            <div className="download-row__actions">
              {d.state === 'progressing' && (
                <>
                  <label className="download-row__launch-toggle">
                    <input
                      type="checkbox"
                      checked={d.launchWhenDone}
                      onChange={(e) =>
                        void window.edToolApp.downloads.setLaunchWhenDone(d.id, e.target.checked)
                      }
                    />
                    Launch when done
                  </label>
                  <button
                    className="btn btn--danger"
                    onClick={() => void window.edToolApp.downloads.cancel(d.id)}
                  >
                    Cancel
                  </button>
                </>
              )}
              {d.state === 'completed' && (
                <>
                  <button
                    className="btn btn--accent"
                    onClick={() => void window.edToolApp.downloads.openFile(d.id)}
                  >
                    Launch
                  </button>
                  <button
                    className="btn"
                    onClick={() => void window.edToolApp.downloads.showInFolder(d.id)}
                  >
                    Show in Folder
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
