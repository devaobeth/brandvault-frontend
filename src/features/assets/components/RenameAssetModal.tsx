import { useEffect, useState, type FormEvent } from 'react'
import type { Asset } from '@/shared/types/api'

type RenameAssetModalProps = {
  asset: Asset | null
  submitting: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export function RenameAssetModal({
  asset,
  submitting,
  onClose,
  onSubmit,
}: RenameAssetModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (asset) {
      setName(asset.name)
      setError(null)
    }
  }, [asset])

  if (!asset) {
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required.')
      return
    }
    setError(null)
    try {
      await onSubmit(trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename.')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-asset-title"
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
      >
        <h2 id="rename-asset-title" className="text-lg font-semibold text-slate-900">
          Rename
        </h2>
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
