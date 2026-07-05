import type { ThemeRecord } from '@shared/types'

/**
 * Hand-written placeholder presets. Not a Dark-Reader-style automatic
 * per-site analysis (that's a later phase) -- just enough CSS injection
 * plumbing to prove the mechanism end-to-end.
 */
export const THEME_PRESETS: ThemeRecord[] = [
  {
    id: 'dark-reader-lite',
    name: 'Dark (generic invert)',
    css: `
      html {
        filter: invert(1) hue-rotate(180deg) !important;
        background: #111 !important;
      }
      img, video, picture, canvas, svg, [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
    `
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    css: `
      html {
        filter: contrast(1.3) saturate(1.2) !important;
      }
      body {
        background: #000 !important;
        color: #fff !important;
      }
    `
  }
]

export function getThemeById(themeId: string | null | undefined): ThemeRecord | undefined {
  if (!themeId) return undefined
  return THEME_PRESETS.find((t) => t.id === themeId)
}
