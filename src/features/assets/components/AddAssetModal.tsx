import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AssetType } from '@/shared/types/api'

export type AddAssetFormValues = {
  name: string
  type: AssetType
  file: File
  folder_id: number | null
  tags: string[]
  description: string
  usage_suggestion: string
}

type FolderOption = {
  id: number | null
  label: string
}

type AddAssetModalProps = {
  open: boolean
  submitting: boolean
  folderOptions: FolderOption[]
  defaultFolderId: number | null
  accept: string
  onClose: () => void
  onSubmit: (values: AddAssetFormValues) => Promise<void>
  onGenerateTags: (values: {
    name: string
    type: AssetType
    file: File
    folder_id: number | null
  }) => Promise<{
    tags: string[]
    description: string
    usage_suggestion: string
  }>
}

const TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'logo', label: 'Logo' },
  { value: 'document', label: 'Document' },
  { value: 'font', label: 'Font' },
]

function guessType(file: File): AssetType {
  const mime = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (name.endsWith('.svg') || mime === 'image/svg+xml') {
    return 'logo'
  }
  if (mime.startsWith('video/')) {
    return 'video'
  }
  if (mime.startsWith('font/') || /\.(ttf|otf|woff2?)$/.test(name)) {
    return 'font'
  }
  if (
    mime.includes('pdf') ||
    mime.includes('document') ||
    mime.includes('text') ||
    /\.(pdf|docx?|txt|rtf)$/.test(name)
  ) {
    return 'document'
  }
  if (mime.startsWith('image/')) {
    return 'image'
  }
  return 'document'
}

export function AddAssetModal({
  open,
  submitting,
  folderOptions,
  defaultFolderId,
  accept,
  onClose,
  onSubmit,
  onGenerateTags,
}: AddAssetModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<AssetType>('image')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [folderId, setFolderId] = useState<number | null>(defaultFolderId)
  const [tagsText, setTagsText] = useState('')
  const [description, setDescription] = useState('')
  const [usageSuggestion, setUsageSuggestion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    setName('')
    setType('image')
    setFile(null)
    setPreviewUrl(null)
    setFolderId(defaultFolderId)
    setTagsText('')
    setDescription('')
    setUsageSuggestion('')
    setError(null)
    setAiBusy(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [open, defaultFolderId])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!open) {
    return null
  }

  const busy = submitting || aiBusy

  function handleFileChange(next: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(next)
    if (!next) {
      setPreviewUrl(null)
      return
    }
    if (!name.trim()) {
      setName(next.name.replace(/\.[^.]+$/, '') || next.name)
    }
    setType(guessType(next))
    if (next.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(next))
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleGenerate() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required before generating tags.')
      return
    }
    if (!file) {
      setError('Choose a file before generating tags.')
      return
    }

    setError(null)
    setAiBusy(true)
    try {
      const suggestion = await onGenerateTags({
        name: trimmedName,
        type,
        file,
        folder_id: folderId,
      })
      setTagsText(suggestion.tags.join(', '))
      setDescription(suggestion.description)
      setUsageSuggestion(suggestion.usage_suggestion)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate tags.')
    } finally {
      setAiBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Name is required.')
      return
    }
    if (!file) {
      setError('Please choose a file to upload.')
      return
    }

    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    setError(null)
    try {
      await onSubmit({
        name: trimmedName,
        type,
        file,
        folder_id: folderId,
        tags,
        description: description.trim(),
        usage_suggestion: usageSuggestion.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add asset.')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-asset-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
      >
        <h2 id="add-asset-title" className="text-lg font-semibold text-slate-900">
          Add asset
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload a file, then optionally generate AI tags from the image.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="asset-file" className="mb-1 block text-sm font-medium text-slate-700">
              File
            </label>
            <input
              ref={fileInputRef}
              id="asset-file"
              type="file"
              accept={accept}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              className="w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1"
            />
            {file ? (
              <p className="mt-1 truncate text-xs text-slate-500">{file.name}</p>
            ) : null}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="mt-2 h-28 w-28 rounded-md object-cover ring-1 ring-slate-200"
              />
            ) : null}
          </div>

          <div>
            <label htmlFor="asset-name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="asset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label htmlFor="asset-type" className="mb-1 block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="asset-type"
              value={type}
              onChange={(event) => setType(event.target.value as AssetType)}
              className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="asset-folder" className="mb-1 block text-sm font-medium text-slate-700">
              Folder
            </label>
            <select
              id="asset-folder"
              value={folderId === null ? '' : String(folderId)}
              onChange={(event) => {
                const value = event.target.value
                setFolderId(value === '' ? null : Number(value))
              }}
              className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {folderOptions.map((option) => (
                <option
                  key={option.id === null ? 'home' : option.id}
                  value={option.id === null ? '' : String(option.id)}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">AI metadata</h3>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleGenerate()}
                className="cursor-pointer text-xs font-medium text-sky-700 hover:underline disabled:opacity-60"
              >
                {aiBusy ? 'Generating…' : 'Generate Tags'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="asset-tags" className="mb-1 block text-sm font-medium text-slate-700">
                  Tags
                </label>
                <input
                  id="asset-tags"
                  value={tagsText}
                  onChange={(event) => setTagsText(event.target.value)}
                  placeholder="campaign, social, product"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Uses the uploaded image when available · review before saving
                </p>
              </div>

              <div>
                <label
                  htmlFor="asset-description"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="asset-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label htmlFor="asset-usage" className="mb-1 block text-sm font-medium text-slate-700">
                  Usage suggestion
                </label>
                <textarea
                  id="asset-usage"
                  value={usageSuggestion}
                  onChange={(event) => setUsageSuggestion(event.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
