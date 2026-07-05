import { useRef } from 'react'
import type { AutoDarkSettings, BookmarkRecord, ThemeRecord } from '@shared/types'

interface ThemePickerPanelProps {
  bookmark: BookmarkRecord
  themes: ThemeRecord[]
  onThemeChange: (themeId: string | null) => void
  onAutoDarkChange: (settings: AutoDarkSettings) => void
}

const DEFAULT_AUTODARK: AutoDarkSettings = { enabled: false, brightness: 1, contrast: 1, sepia: 0 }

export default function ThemePickerPanel({
  bookmark,
  themes,
  onThemeChange,
  onAutoDarkChange
}: ThemePickerPanelProps) {
  const current = bookmark.autoDark ?? DEFAULT_AUTODARK
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function pushChange(next: AutoDarkSettings): void {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onAutoDarkChange(next), 150)
  }

  function updateField(field: keyof AutoDarkSettings, value: number | boolean): void {
    pushChange({ ...current, [field]: value })
  }

  return (
    <div className="theme-picker-bar">
      <label className="theme-picker-bar__group theme-picker-bar__toggle">
        <input
          type="checkbox"
          checked={current.enabled}
          onChange={(e) => updateField('enabled', e.target.checked)}
        />
        Auto Dark
      </label>
      <label className="theme-picker-bar__group">
        <span>Brightness</span>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          defaultValue={current.brightness}
          onChange={(e) => updateField('brightness', Number(e.target.value))}
        />
      </label>
      <label className="theme-picker-bar__group">
        <span>Contrast</span>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          defaultValue={current.contrast}
          onChange={(e) => updateField('contrast', Number(e.target.value))}
        />
      </label>
      <label className="theme-picker-bar__group">
        <span>Sepia</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          defaultValue={current.sepia}
          onChange={(e) => updateField('sepia', Number(e.target.value))}
        />
      </label>
      <label className="theme-picker-bar__group theme-picker-bar__legacy">
        <span>Legacy preset</span>
        <select value={bookmark.themeId ?? ''} onChange={(e) => onThemeChange(e.target.value || null)}>
          <option value="">No theme</option>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
