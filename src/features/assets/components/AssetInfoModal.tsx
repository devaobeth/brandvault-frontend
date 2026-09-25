import { useEffect } from 'react'
import type { Asset } from '@/shared/types/api'
import { assetTypeIcon } from '@/features/assets/components/FileTypeIcons'

type AssetInfoModalProps = {
  asset: Asset | null
  folderName: string
  onClose: () => void
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

function fileNameFromUrl(url: string) {
  try {
    const path = new URL(url, window.location.origin).pathname
    const segment = path.split('/').filter(Boolean).pop()
    return segment ? decodeURIComponent(segment) : '—'
  } catch {
    return '—'
  }
}

export function AssetInfoModal({
  asset,
  folderName,
  onClose,
}: AssetInfoModalProps) {
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

  const rows: { label: string; value: string; link?: boolean }[] = [
    { label: 'Name', value: asset.name },
    { label: 'Type', value: asset.type },
    { label: 'Location', value: folderName },
    { label: 'File', value: fileNameFromUrl(asset.url) },
    { label: 'URL', value: asset.url, link: true },
    { label: 'Created', value: formatDate(asset.created_at) },
    { label: 'Modified', value: formatDate(asset.updated_at) },
  ]

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-info-title"
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50 ring-1 ring-slate-200">
            {asset.type === 'image' || asset.type === 'logo' ? (
              <img
                src={asset.url}
                alt=""
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              assetTypeIcon(asset.type, 'h-10 w-10')
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="asset-info-title" className="text-lg font-semibold text-slate-900">
              Asset details
            </h2>
            <p className="truncate text-sm text-slate-500">{asset.name}</p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[7rem_1fr] gap-2 px-3 py-2 text-sm">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="min-w-0 break-all text-slate-800">
                {row.link ? (
                  <a
                    href={row.value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline-offset-2 hover:underline"
                  >
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 rounded-md border border-slate-200">
          <div className="border-b border-slate-100 px-3 py-2">
            <h3 className="text-sm font-semibold text-slate-900">AI metadata</h3>
          </div>
          <dl className="divide-y divide-slate-100">
            <div className="grid grid-cols-[7rem_1fr] gap-2 px-3 py-2 text-sm">
              <dt className="text-slate-500">Tags</dt>
              <dd className="min-w-0 break-words text-slate-800">
                {asset.tags?.length ? asset.tags.join(', ') : (
                  <span className="text-slate-400">Not set</span>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-2 px-3 py-2 text-sm">
              <dt className="text-slate-500">Description</dt>
              <dd className="min-w-0 break-words text-slate-800">
                {asset.description || (
                  <span className="text-slate-400">Not set</span>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-2 px-3 py-2 text-sm">
              <dt className="text-slate-500">Usage</dt>
              <dd className="min-w-0 break-words text-slate-800">
                {asset.usage_suggestion || (
                  <span className="text-slate-400">Not set</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
