import { useEffect } from 'react'
import type { Asset } from '@/shared/types/api'

type AssetPreviewModalProps = {
  asset: Asset | null
  onClose: () => void
}

export function isPdfAsset(asset: Asset) {
  return asset.type === 'document' && /\.pdf($|\?)/i.test(asset.url)
}

export function canPreviewAsset(asset: Asset) {
  return (
    asset.type === 'image' ||
    asset.type === 'logo' ||
    asset.type === 'video' ||
    isPdfAsset(asset)
  )
}

export function AssetPreviewModal({ asset, onClose }: AssetPreviewModalProps) {
  useEffect(() => {
    if (!asset) {
      return
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [asset, onClose])

  if (!asset) {
    return null
  }

  const isVideo = asset.type === 'video'
  const isPdf = isPdfAsset(asset)
  const isImage = asset.type === 'image' || asset.type === 'logo'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={asset.name}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="truncate text-sm font-medium text-white">{asset.name}</p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded px-2 py-1 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-black/40 p-4">
          {isImage ? (
            <img
              src={asset.url}
              alt={asset.name}
              className="max-h-[75vh] max-w-full object-contain"
            />
          ) : null}

          {isVideo ? (
            <video
              src={asset.url}
              controls
              autoPlay
              className="max-h-[75vh] max-w-full"
            >
              Your browser does not support video playback.
            </video>
          ) : null}

          {isPdf ? (
            <iframe
              title={asset.name}
              src={asset.url}
              className="h-[75vh] w-full rounded bg-white"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
