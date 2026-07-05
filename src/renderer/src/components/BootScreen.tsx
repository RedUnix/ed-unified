export default function BootScreen() {
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
