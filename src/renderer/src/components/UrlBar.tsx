import { useEffect, useState } from 'react'

interface UrlBarProps {
  currentUrl: string
  onNavigate: (input: string) => void
}

/**
 * Address bar shown above user-opened (non-bookmark) tabs. Tracks the tab's
 * live URL while idle, but stops syncing while the user is editing.
 */
export default function UrlBar({ currentUrl, onNavigate }: UrlBarProps) {
  const [value, setValue] = useState(currentUrl)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setValue(currentUrl)
  }, [currentUrl, focused])

  function submit(): void {
    const input = value.trim()
    if (input) onNavigate(input)
  }

  return (
    <div className="url-bar">
      <input
        className="url-bar__input"
        type="text"
        placeholder="Enter a URL or search..."
        value={value}
        autoFocus={!currentUrl}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => {
          setFocused(true)
          e.target.select()
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
      />
      <button className="btn" onClick={submit}>
        Go
      </button>
    </div>
  )
}
