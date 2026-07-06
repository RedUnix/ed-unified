import { useRef, useState } from 'react'
import type { AppSettings, ThemeColors, UpdateCheckResult } from '@shared/types'
import { applyThemeColors } from '../utils/applyThemeColors'

interface AppSettingsControlProps {
  settings: AppSettings | null
  onSettingsChange: (settings: AppSettings) => void
}

const DEFAULT_COLORS: ThemeColors = {
  accent: '#c75a08',
  accentStrong: '#ff6f00',
  accentDim: '#8e4108',
  bgApp: '#141416'
}

export default function AppSettingsControl({ settings, onSettingsChange }: AppSettingsControlProps) {
  const [open, setOpen] = useState(false)
  const opacityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  const colors = { ...DEFAULT_COLORS, ...settings?.themeColors }

  async function handleChooseImage(): Promise<void> {
    const path = await window.edToolApp.settings.pickLibraryBackground()
    if (!path) return
    const updated = await window.edToolApp.settings.setLibraryBackground(path)
    onSettingsChange(updated)
  }

  async function handleRemove(): Promise<void> {
    const updated = await window.edToolApp.settings.setLibraryBackground(null)
    onSettingsChange(updated)
  }

  function handleOpacityChange(value: number): void {
    if (opacityDebounceRef.current) clearTimeout(opacityDebounceRef.current)
    opacityDebounceRef.current = setTimeout(() => {
      void window.edToolApp.settings.setLibraryBackgroundOpacity(value).then(onSettingsChange)
    }, 150)
  }

  async function handleAdblockToggle(enabled: boolean): Promise<void> {
    const updated = await window.edToolApp.settings.setAdblockEnabled(enabled)
    onSettingsChange(updated)
  }

  function handleColorChange(key: keyof ThemeColors, value: string): void {
    const nextColors = { ...colors, [key]: value }
    applyThemeColors(nextColors)
    if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current)
    colorDebounceRef.current = setTimeout(() => {
      void window.edToolApp.settings.setThemeColors(nextColors).then(onSettingsChange)
    }, 150)
  }

  async function handleResetColors(): Promise<void> {
    applyThemeColors(null)
    const updated = await window.edToolApp.settings.setThemeColors(null)
    onSettingsChange(updated)
  }

  async function handleCheckForUpdates(): Promise<void> {
    setCheckingUpdate(true)
    const result = await window.edToolApp.updates.check()
    setUpdateCheck(result)
    setCheckingUpdate(false)
  }

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        Settings...
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__title">Settings</div>

            <div className="field">
              <label>Background Image</label>
              <button type="button" className="btn" onClick={() => void handleChooseImage()}>
                Choose Image...
              </button>
            </div>
            <div className="field">
              <label>Opacity</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                defaultValue={settings?.libraryBackgroundOpacity ?? 0.35}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
              />
            </div>
            {settings?.libraryBackgroundPath && (
              <button type="button" className="btn btn--danger" onClick={() => void handleRemove()}>
                Remove Background
              </button>
            )}

            <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={settings?.adblockEnabled ?? true}
                onChange={(e) => void handleAdblockToggle(e.target.checked)}
              />
              <span>Block ads &amp; trackers (new tabs)</span>
            </label>

            <div className="field">
              <label>Theme Colors</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                  />
                  <span>Accent</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={colors.accentStrong}
                    onChange={(e) => handleColorChange('accentStrong', e.target.value)}
                  />
                  <span>Accent (Strong)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={colors.accentDim}
                    onChange={(e) => handleColorChange('accentDim', e.target.value)}
                  />
                  <span>Accent (Dim)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={colors.bgApp}
                    onChange={(e) => handleColorChange('bgApp', e.target.value)}
                  />
                  <span>Background</span>
                </label>
              </div>
              <button type="button" className="btn" onClick={() => void handleResetColors()}>
                Reset Colors to Default
              </button>
            </div>

            <div className="field">
              <label>Updates</label>
              <button
                type="button"
                className="btn"
                disabled={checkingUpdate}
                onClick={() => void handleCheckForUpdates()}
              >
                {checkingUpdate ? 'Checking...' : 'Check for Updates'}
              </button>
              {updateCheck && (
                <span style={{ marginTop: 6 }}>
                  {updateCheck.available ? (
                    <>
                      Update available: v{updateCheck.latestVersion}{' '}
                      <button
                        type="button"
                        className="btn btn--accent"
                        onClick={() => void window.edToolApp.updates.openReleasePage(updateCheck.releaseUrl)}
                      >
                        View Release
                      </button>
                    </>
                  ) : (
                    `You're up to date (v${updateCheck.currentVersion}).`
                  )}
                </span>
              )}
            </div>

            <div className="modal__actions">
              <button type="button" className="btn btn--accent" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
