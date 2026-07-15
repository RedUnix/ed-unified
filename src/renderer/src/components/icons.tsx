interface IconProps {
  size?: number
}

const commonProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export function ComputerIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...commonProps}>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  )
}

export function RocketIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...commonProps}>
      <path d="M12 2c2.5 2 4 5.5 4 9.5 0 2-.5 4-1 5.5l-3 3-3-3c-.5-1.5-1-3.5-1-5.5C8 7.5 9.5 4 12 2z" />
      <circle cx="12" cy="10" r="1.5" />
      <path d="M8.5 15.5 6 18l1 3 3-1" />
      <path d="M15.5 15.5 18 18l-1 3-3-1" />
    </svg>
  )
}

export function DownloadIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...commonProps}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  )
}

export function MaximizeIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...commonProps}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  )
}

export function RestoreIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...commonProps}>
      <path d="M9 3v6H3" />
      <path d="M15 21v-6h6" />
      <path d="M3 9l7-7" />
      <path d="M21 15l-7 7" />
    </svg>
  )
}

export function ChevronCollapseIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...commonProps}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

export function ChevronExpandIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...commonProps}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}
