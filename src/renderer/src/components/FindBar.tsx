import { useEffect, useRef, useState } from 'react'

interface FindBarProps {
  tabId: string
  onClose: () => void
}

/**
 * In-page search bar for the active website tab. Drives Electron's
 * findInPage() over IPC; match counts stream back via 'found-in-page'
 * tab events.
 */
export default function FindBar({ tabId, onClose }: FindBarProps) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ ordinal: number; matches: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef('')

  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      // Clears the highlight overlay when the bar closes (or its tab goes away).
      void window.edToolApp.tabs.stopFindInPage(tabId)
    }
  }, [tabId])

  useEffect(() => {
    const unsubscribe = window.edToolApp.onTabEvent((event) => {
      if (event.type === 'found-in-page' && event.tabId === tabId) {
        setResult({ ordinal: event.activeMatchOrdinal, matches: event.matches })
      }
    })
    return unsubscribe
  }, [tabId])

  // Note on Electron's confusingly named findNext option: true means "begin a
  // NEW find session" (initial request), false means "step within the current
  // session" (follow-up). Getting this backwards makes findInPage a silent no-op.
  function handleChange(value: string): void {
    setText(value)
    textRef.current = value
    if (value) {
      void window.edToolApp.tabs.findInPage(tabId, value, true, true)
    } else {
      setResult(null)
      void window.edToolApp.tabs.stopFindInPage(tabId)
    }
  }

  function step(forward: boolean): void {
    if (textRef.current) {
      void window.edToolApp.tabs.findInPage(tabId, textRef.current, forward, false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault()
      step(!e.shiftKey)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="find-bar">
      <input
        ref={inputRef}
        className="find-bar__input"
        type="text"
        placeholder="Find in page..."
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <span className="find-bar__count">
        {text ? `${result?.ordinal ?? 0}/${result?.matches ?? 0}` : ''}
      </span>
      <button className="tab-nav-controls__btn" onClick={() => step(false)} title="Previous match">
        &#8593;
      </button>
      <button className="tab-nav-controls__btn" onClick={() => step(true)} title="Next match">
        &#8595;
      </button>
      <button className="tab-nav-controls__btn" onClick={onClose} title="Close (Esc)">
        &times;
      </button>
    </div>
  )
}
