interface TabNavControlsProps {
  canGoBack: boolean
  canGoForward: boolean
  onGoBack: () => void
  onGoForward: () => void
}

export default function TabNavControls({
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward
}: TabNavControlsProps) {
  return (
    <div className="tab-nav-controls">
      <button className="tab-nav-controls__btn" onClick={onGoBack} disabled={!canGoBack} title="Back">
        &#8592;
      </button>
      <button
        className="tab-nav-controls__btn"
        onClick={onGoForward}
        disabled={!canGoForward}
        title="Forward"
      >
        &#8594;
      </button>
    </div>
  )
}
