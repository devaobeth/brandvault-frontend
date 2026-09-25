import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AssetType } from '@/shared/types/api'
import {
  parseTags,
  validateAssetFile,
  validateName,
  validateOptionalLongText,
  validateTags,
} from '@/features/assets/lib/validation'
import { fieldClass, fileFieldClass } from '@/shared/lib/formField'

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

type FieldErrors = {
  file?: string
  name?: string
  tags?: string
  description?: string
  usage_suggestion?: string
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
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
    setFieldErrors({})
    setFormError(null)
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

  function clearFieldError(key: keyof FieldErrors) {
    setFieldErrors((current) => {
      if (!current[key]) {
        return current
      }
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function validateFields(options: { requireFile: boolean }): FieldErrors {
    const next: FieldErrors = {}
    const nameError = validateName(name)
    if (nameError) {
      next.name = nameError
    }
    const fileError = validateAssetFile(file, { required: options.requireFile })
    if (fileError) {
      next.file = fileError
    }
    const tags = parseTags(tagsText)
    const tagsError = validateTags(tags)
    if (tagsError) {
      next.tags = tagsError
    }
    const descriptionError = validateOptionalLongText(description, 'Description')
    if (descriptionError) {
      next.description = descriptionError
    }
    const usageError = validateOptionalLongText(usageSuggestion, 'Usage suggestion')
    if (usageError) {
      next.usage_suggestion = usageError
    }
    return next
  }

  function handleFileChange(next: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(next)
    clearFieldError('file')
    if (!next) {
      setPreviewUrl(null)
      return
    }
    const fileError = validateAssetFile(next, { required: true })
    if (fileError) {
      setFieldErrors((current) => ({ ...current, file: fileError }))
    }
    if (!name.trim()) {
      setName(next.name.replace(/\.[^.]+$/, '') || next.name)
      clearFieldError('name')
    }
    setType(guessType(next))
    if (next.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(next))
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleGenerate() {
    const next = validateFields({ requireFile: true })
    setFieldErrors(next)
    setFormError(null)
    if (next.name || next.file) {
      return
    }

    setAiBusy(true)
    try {
      const suggestion = await onGenerateTags({
        name: name.trim(),
        type,
        file: file!,
        folder_id: folderId,
      })
      setTagsText(suggestion.tags.join(', '))
      setDescription(suggestion.description)
      setUsageSuggestion(suggestion.usage_suggestion)
      setFieldErrors({})
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not generate tags.')
    } finally {
      setAiBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const next = validateFields({ requireFile: true })
    setFieldErrors(next)
    if (Object.keys(next).length > 0 || !file) {
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        type,
        file,
        folder_id: folderId,
        tags: parseTags(tagsText),
        description: description.trim(),
        usage_suggestion: usageSuggestion.trim(),
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add asset.')
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

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4" noValidate>
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
              className={fileFieldClass(Boolean(fieldErrors.file))}
              aria-invalid={Boolean(fieldErrors.file)}
              aria-describedby={fieldErrors.file ? 'asset-file-error' : undefined}
            />
            {file ? (
              <p className="mt-1 truncate text-xs text-slate-500">{file.name}</p>
            ) : null}
            {fieldErrors.file ? (
              <p id="asset-file-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.file}
              </p>
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
              onChange={(event) => {
                setName(event.target.value)
                clearFieldError('name')
              }}
              className={fieldClass(Boolean(fieldErrors.name))}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'asset-name-error' : undefined}
            />
            {fieldErrors.name ? (
              <p id="asset-name-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="asset-type" className="mb-1 block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="asset-type"
              value={type}
              onChange={(event) => setType(event.target.value as AssetType)}
              className={fieldClass(false, 'cursor-pointer')}
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
              className={fieldClass(false, 'cursor-pointer')}
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
                  onChange={(event) => {
                    setTagsText(event.target.value)
                    clearFieldError('tags')
                  }}
                  placeholder="campaign, social, product"
                  className={fieldClass(Boolean(fieldErrors.tags))}
                  aria-invalid={Boolean(fieldErrors.tags)}
                  aria-describedby={fieldErrors.tags ? 'asset-tags-error' : undefined}
                />
                {fieldErrors.tags ? (
                  <p id="asset-tags-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.tags}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Uses the uploaded image when available · review before saving
                  </p>
                )}
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
                  onChange={(event) => {
                    setDescription(event.target.value)
                    clearFieldError('description')
                  }}
                  rows={2}
                  className={fieldClass(Boolean(fieldErrors.description))}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={
                    fieldErrors.description ? 'asset-description-error' : undefined
                  }
                />
                {fieldErrors.description ? (
                  <p id="asset-description-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.description}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="asset-usage" className="mb-1 block text-sm font-medium text-slate-700">
                  Usage suggestion
                </label>
                <textarea
                  id="asset-usage"
                  value={usageSuggestion}
                  onChange={(event) => {
                    setUsageSuggestion(event.target.value)
                    clearFieldError('usage_suggestion')
                  }}
                  rows={2}
                  className={fieldClass(Boolean(fieldErrors.usage_suggestion))}
                  aria-invalid={Boolean(fieldErrors.usage_suggestion)}
                  aria-describedby={
                    fieldErrors.usage_suggestion ? 'asset-usage-error' : undefined
                  }
                />
                {fieldErrors.usage_suggestion ? (
                  <p id="asset-usage-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.usage_suggestion}
                  </p>
                ) : null}
              </div>
            </div>
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
