interface BootScreenProps {
  /** 'boot' is the app-startup splash; 'launch' is the small tool-launch overlay. */
  variant?: 'boot' | 'launch'
  toolName?: string
}

export default function BootScreen({ variant = 'boot', toolName }: BootScreenProps) {
  if (variant === 'launch') {
    return (
      <div className="boot-screen boot-screen--launch">
        <div className="boot-screen__frame">
          <div className="boot-screen__scanline" />
          <div className="boot-screen__subtitle">Launching</div>
          <div className="boot-screen__wordmark boot-screen__launch-name">
            <span className="boot-screen__word boot-screen__word--accent">{toolName}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="boot-screen">
      <div className="boot-screen__frame">
        <div className="boot-screen__scanline" />
        <div className="boot-screen__wordmark">
          <span className="boot-screen__word">ED</span>
          <span className="boot-screen__word boot-screen__word--accent">UNIFIED</span>
        </div>
        <div className="boot-screen__subtitle">INITIALIZING</div>
      </div>
    </div>
  )
}
