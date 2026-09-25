import { useState, type FormEvent } from 'react'

type CreateFolderModalProps = {
  open: boolean
  parentLabel: string
  submitting: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export function CreateFolderModal({
  open,
  parentLabel,
  submitting,
  onClose,
  onSubmit,
}: CreateFolderModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Folder name is required.')
      return
    }

    setError(null)
    try {
      await onSubmit(trimmed)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create folder.')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-folder-title"
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
      >
        <h2 id="create-folder-title" className="text-lg font-semibold text-slate-900">
          New folder
        </h2>
        <p className="mt-1 text-sm text-slate-500">Inside: {parentLabel}</p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="folder-name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="folder-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setName('')
                setError(null)
                onClose()
              }}
              className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
