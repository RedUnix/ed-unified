import type { UpdateCheckResult } from '@shared/types'

interface UpdateToastProps {
  updateInfo: UpdateCheckResult
  onOpenReleasePage: () => void
  onDismiss: () => void
}

export default function UpdateToast({ updateInfo, onOpenReleasePage, onDismiss }: UpdateToastProps) {
  return (
    <div className="update-toast">
      <span className="update-toast__text">Update available: v{updateInfo.latestVersion}</span>
      <button className="btn btn--accent" onClick={onOpenReleasePage}>
        View
      </button>
      <button className="update-toast__close" onClick={onDismiss} title="Dismiss">
        &times;
      </button>
    </div>
  )
}
