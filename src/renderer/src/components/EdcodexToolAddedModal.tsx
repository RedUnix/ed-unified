import type { ProtocolToolImportResult } from '@shared/types'

interface EdcodexToolAddedModalProps {
  result: ProtocolToolImportResult
  onOpenDownloadPage: (url: string) => void
  onClose: () => void
}

/**
 * Shown after an `edtoolapp://import-tool` click resolves: the tool's metadata
 * is already in the library; the user still has to download/install the
 * program and link it via the card's "Locate Program..." button.
 */
export default function EdcodexToolAddedModal({
  result,
  onOpenDownloadPage,
  onClose
}: EdcodexToolAddedModalProps) {
  const { record, downloadUrl, alreadyExisted } = result
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">
          {alreadyExisted ? 'Already in your library' : 'Tool added from EDCodex'}
        </div>
        <div>
          {alreadyExisted ? (
            <>
              &quot;{record.name}&quot; is already in your library.
              {!record.installedExePath &&
                ' If you have installed it, click "Locate Program..." on its card to link the program.'}
            </>
          ) : (
            <>
              Now download and install &quot;{record.name}&quot; -- its info has been auto-filled.
              Once installed, click &quot;Locate Program...&quot; on its card to link the program.
            </>
          )}
        </div>
        <div className="modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          {downloadUrl && (
            <button
              type="button"
              className="btn btn--accent"
              onClick={() => onOpenDownloadPage(downloadUrl)}
            >
              Open Download Page
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
