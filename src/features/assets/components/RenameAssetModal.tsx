import { useEffect, useState, type FormEvent } from 'react'
import type { Asset } from '@/shared/types/api'
import { validateName } from '@/features/assets/lib/validation'
import { fieldClass } from '@/shared/lib/formField'

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
  const [nameError, setNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (asset) {
      setName(asset.name)
      setNameError(undefined)
      setFormError(null)
    }
  }, [asset])

  if (!asset) {
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const error = validateName(name)
    setNameError(error)
    setFormError(null)
    if (error) {
      return
    }
    try {
      await onSubmit(name.trim())
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not rename.')
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
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3" noValidate>
          <div>
            <label htmlFor="rename-asset-name" className="sr-only">
              Name
            </label>
            <input
              id="rename-asset-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameError(undefined)
              }}
              autoFocus
              className={fieldClass(Boolean(nameError))}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'rename-asset-name-error' : undefined}
            />
            {nameError ? (
              <p id="rename-asset-name-error" className="mt-1 text-xs text-red-600">
                {nameError}
              </p>
            ) : null}
          </div>
          {formError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </p>
          ) : null}
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
