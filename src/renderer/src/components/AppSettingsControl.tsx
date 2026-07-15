import { useRef, useState } from 'react'
import type { AppSettings, ChatCommandRecord, ImportSummary, ThemeColors, UpdateCheckResult } from '@shared/types'
import { applyThemeColors } from '../utils/applyThemeColors'
import { useLibrary } from '../state/libraryStore'

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
  const { refresh } = useLibrary()
  const [open, setOpen] = useState(false)
  const opacityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [backupStatus, setBackupStatus] = useState<string | null>(null)

  const colors = { ...DEFAULT_COLORS, ...settings?.themeColors }
  const chatCommands = settings?.chatCommands ?? []

  async function patchSettings(patch: Partial<AppSettings>): Promise<void> {
    const updated = await window.edToolApp.settings.update(patch)
    onSettingsChange(updated)
  }

  function updateChatCommand(index: number, patch: Partial<ChatCommandRecord>): void {
    const next = chatCommands.map((c, i) => (i === index ? { ...c, ...patch } : c))
    void patchSettings({ chatCommands: next })
  }

  async function handleExport(): Promise<void> {
    setBackupStatus(null)
    const path = await window.edToolApp.backup.export()
    if (path) setBackupStatus(`Exported to ${path}`)
  }

  async function handleImport(): Promise<void> {
    setBackupStatus(null)
    let summary: ImportSummary | null
    try {
      summary = await window.edToolApp.backup.import()
    } catch (err) {
      setBackupStatus(err instanceof Error ? err.message : String(err))
      return
    }
    if (!summary) return
    onSettingsChange(summary.settings)
    applyThemeColors(summary.settings.themeColors)
    await refresh()
    setBackupStatus(
      `Imported ${summary.bookmarks} bookmarks, ${summary.tools} tools, ${summary.categories} categories, ${summary.launchSequences} sequences.`
    )
  }

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
              <label>Game Integration</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={settings?.autoCloseToolsOnGameExit ?? false}
                  onChange={(e) => void patchSettings({ autoCloseToolsOnGameExit: e.target.checked })}
                />
                <span>Close companion tools when Elite Dangerous exits</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={settings?.screenshotBackgroundEnabled ?? false}
                  onChange={(e) =>
                    void patchSettings({ screenshotBackgroundEnabled: e.target.checked })
                  }
                />
                <span>Newest ED screenshot becomes library background</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={settings?.chatCommandsEnabled ?? false}
                  onChange={(e) => void patchSettings({ chatCommandsEnabled: e.target.checked })}
                />
                <span>In-game chat commands (journal, e.g. &quot;!inara Sol&quot;)</span>
              </label>
            </div>

            {settings?.chatCommandsEnabled && (
              <div className="field">
                <label>Chat Commands ({'{arg}'} = command argument)</label>
                {chatCommands.map((command, index) => (
                  <div key={index} style={{ display: 'flex', gap: 6 }}>
                    <input
                      style={{ width: 90 }}
                      value={command.command}
                      placeholder="inara"
                      onChange={(e) => updateChatCommand(index, { command: e.target.value })}
                    />
                    <input
                      style={{ flex: 1 }}
                      value={command.urlTemplate}
                      placeholder="https://example.com/?q={arg}"
                      onChange={(e) => updateChatCommand(index, { urlTemplate: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        void patchSettings({
                          chatCommands: chatCommands.filter((_, i) => i !== index)
                        })
                      }
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    void patchSettings({
                      chatCommands: [...chatCommands, { command: '', urlTemplate: '' }]
                    })
                  }
                >
                  Add Command
                </button>
              </div>
            )}

            <div className="field">
              <label>Local Webhook API (for VoiceAttack / scripts)</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={settings?.webhookEnabled ?? false}
                  onChange={(e) => void patchSettings({ webhookEnabled: e.target.checked })}
                />
                <span>Enable http://127.0.0.1:{settings?.webhookPort ?? 8425}</span>
              </label>
              {settings?.webhookEnabled && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Port</span>
                  <input
                    type="number"
                    min={1024}
                    max={65535}
                    style={{ width: 100 }}
                    defaultValue={settings?.webhookPort ?? 8425}
                    onBlur={(e) => {
                      const port = Number(e.target.value)
                      if (port >= 1024 && port <= 65535 && port !== settings?.webhookPort) {
                        void patchSettings({ webhookPort: port })
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="field">
              <label>Backup</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn" onClick={() => void handleExport()}>
                  Export Data...
                </button>
                <button type="button" className="btn" onClick={() => void handleImport()}>
                  Import Data...
                </button>
              </div>
              {backupStatus && <span style={{ marginTop: 6, fontSize: 12 }}>{backupStatus}</span>}
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
