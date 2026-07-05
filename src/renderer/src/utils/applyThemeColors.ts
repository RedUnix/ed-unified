import type { ThemeColors } from '@shared/types'

const VAR_MAP: Record<keyof ThemeColors, string> = {
  accent: '--accent',
  accentStrong: '--accent-strong',
  accentDim: '--accent-dim',
  bgApp: '--bg-app'
}

export function applyThemeColors(colors: ThemeColors | null | undefined): void {
  const root = document.documentElement.style
  for (const key of Object.keys(VAR_MAP) as (keyof ThemeColors)[]) {
    const value = colors?.[key]
    if (value) root.setProperty(VAR_MAP[key], value)
    else root.removeProperty(VAR_MAP[key])
  }
}
