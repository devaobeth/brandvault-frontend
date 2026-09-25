import type { AssetType } from '@/shared/types/api'

type IconProps = {
  className?: string
  title?: string
}

export function HomeIcon({ className = 'h-4 w-4', title }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <path d="M12 3.2 3.5 10.2V21h6.2v-6.1h4.6V21h6.2V10.2L12 3.2Z" />
    </svg>
  )
}

export function FolderIcon({ className = 'h-4 w-4', title }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <path
        fill="#E8B84A"
        d="M3.5 7.2c0-.9.7-1.6 1.6-1.6h4.1l1.5 1.5h8.2c.9 0 1.6.7 1.6 1.6v9.5c0 .9-.7 1.6-1.6 1.6H5.1c-.9 0-1.6-.7-1.6-1.6V7.2Z"
      />
      <path
        fill="#F5D06A"
        d="M3.5 9.2h17v9.3c0 .9-.7 1.6-1.6 1.6H5.1c-.9 0-1.6-.7-1.6-1.6V9.2Z"
      />
    </svg>
  )
}

export function ImageFileIcon({ className = 'h-10 w-10', title }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <rect x="6" y="8" width="36" height="32" rx="3" fill="#E8F1FB" stroke="#5B8DEF" strokeWidth="2" />
      <circle cx="17" cy="18" r="4" fill="#F0C14A" />
      <path d="M8 34 18 22l8 8 6-5 8 9H8Z" fill="#5B8DEF" opacity="0.85" />
    </svg>
  )
}

export function VideoFileIcon({ className = 'h-10 w-10', title }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <rect x="6" y="10" width="36" height="28" rx="3" fill="#3B3F4A" />
      <path d="M20 18v12l12-6-12-6Z" fill="#F3F4F6" />
    </svg>
  )
}

export function LogoFileIcon({ className = 'h-10 w-10', title }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <rect x="8" y="8" width="32" height="32" rx="6" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2" />
      <path d="M16 30V18h6.2c3.2 0 5.2 1.7 5.2 4.3 0 2.6-2 4.3-5.2 4.3H20v3.4H16Zm4-6.6h1.8c1.3 0 2.1-.7 2.1-1.7s-.8-1.7-2.1-1.7H20v3.4Z" fill="#4F46E5" />
    </svg>
  )
}

export function DocumentFileIcon({ className = 'h-10 w-10', title }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <path d="M14 6h14l10 10v26c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
      <path d="M28 6v10h10" fill="none" stroke="#94A3B8" strokeWidth="2" />
      <path d="M18 24h12M18 30h12M18 36h8" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function FontFileIcon({ className = 'h-10 w-10', title }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <rect x="8" y="8" width="32" height="32" rx="4" fill="#FFF7ED" stroke="#F59E0B" strokeWidth="2" />
      <text x="24" y="31" textAnchor="middle" fontSize="16" fontWeight="700" fill="#B45309" fontFamily="Georgia, serif">
        Aa
      </text>
    </svg>
  )
}

export function LargeFolderIcon({ className = 'h-12 w-12', title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <path
        fill="#E8B84A"
        d="M8 18c0-2.2 1.8-4 4-4h12l4 4h24c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V18Z"
      />
      <path fill="#F5D06A" d="M8 24h48v26c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V24Z" />
    </svg>
  )
}

export function assetTypeIcon(type: AssetType, className = 'h-10 w-10') {
  switch (type) {
    case 'image':
      return <ImageFileIcon className={className} />
    case 'video':
      return <VideoFileIcon className={className} />
    case 'logo':
      return <LogoFileIcon className={className} />
    case 'document':
      return <DocumentFileIcon className={className} />
    case 'font':
      return <FontFileIcon className={className} />
  }
}
