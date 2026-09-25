import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Asset, AssetType } from '@/shared/types/api'
import {
  parseTags,
  validateAssetFile,
  validateName,
  validateOptionalLongText,
  validateTags,
} from '@/features/assets/lib/validation'
import { fieldClass, fileFieldClass } from '@/shared/lib/formField'

export type EditAssetFormValues = {
  name: string
  file?: File
  folder_id: number | null
  tags: string[]
  description: string
  usage_suggestion: string
}

type FolderOption = {
  id: number | null
  label: string
}

type EditAssetModalProps = {
  asset: Asset | null
  submitting: boolean
  folderOptions: FolderOption[]
  accept: string
  onClose: () => void
  onSubmit: (values: EditAssetFormValues) => Promise<void>
  onGenerateTags: (values: {
    name: string
    type: AssetType
    file?: File
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

export function EditAssetModal({
  asset,
  submitting,
  folderOptions,
  accept,
  onClose,
  onSubmit,
  onGenerateTags,
}: EditAssetModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<AssetType>('image')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [folderId, setFolderId] = useState<number | null>(null)
  const [tagsText, setTagsText] = useState('')
  const [description, setDescription] = useState('')
  const [usageSuggestion, setUsageSuggestion] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)

  useEffect(() => {
    if (!asset) {
      return
    }
    setName(asset.name)
    setType(asset.type)
    setFile(null)
    setPreviewUrl(
      asset.type === 'image' || asset.type === 'logo' ? asset.url : null,
    )
    setFolderId(asset.folder_id)
    setTagsText(asset.tags?.length ? asset.tags.join(', ') : '')
    setDescription(asset.description ?? '')
    setUsageSuggestion(asset.usage_suggestion ?? '')
    setFieldErrors({})
    setFormError(null)
    setAiBusy(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [asset])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!asset) {
    return null
  }

  const current = asset
  const busy = submitting || aiBusy

  function clearFieldError(key: keyof FieldErrors) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[key]) {
        return currentErrors
      }
      const next = { ...currentErrors }
      delete next[key]
      return next
    })
  }

  function validateFields(): FieldErrors {
    const next: FieldErrors = {}
    const nameError = validateName(name)
    if (nameError) {
      next.name = nameError
    }
    const fileError = validateAssetFile(file, { required: false })
    if (fileError) {
      next.file = fileError
    }
    const tagsError = validateTags(parseTags(tagsText))
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
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(next)
    clearFieldError('file')
    if (!next) {
      setPreviewUrl(
        current.type === 'image' || current.type === 'logo' ? current.url : null,
      )
      setType(current.type)
      return
    }
    const fileError = validateAssetFile(next, { required: false })
    if (fileError) {
      setFieldErrors((currentErrors) => ({ ...currentErrors, file: fileError }))
    }
    setType(guessType(next))
    if (next.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(next))
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleGenerate() {
    const nameError = validateName(name)
    if (nameError) {
      setFieldErrors({ name: nameError })
      return
    }
    setFieldErrors({})
    setFormError(null)
    setAiBusy(true)
    try {
      const suggestion = await onGenerateTags({
        name: name.trim(),
        type,
        file: file ?? undefined,
      })
      setTagsText(suggestion.tags.join(', '))
      setDescription(suggestion.description)
      setUsageSuggestion(suggestion.usage_suggestion)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not generate tags.')
    } finally {
      setAiBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const next = validateFields()
    setFieldErrors(next)
    if (Object.keys(next).length > 0) {
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        file: file ?? undefined,
        folder_id: folderId,
        tags: parseTags(tagsText),
        description: description.trim(),
        usage_suggestion: usageSuggestion.trim(),
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not update asset.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-asset-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="edit-asset-title" className="text-lg font-semibold text-slate-900">
          Edit asset
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Update details, optionally replace the file, and review AI metadata.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4" noValidate>
          <div>
            <label htmlFor="edit-asset-file" className="mb-1 block text-sm font-medium text-slate-700">
              File
            </label>
            <input
              ref={fileInputRef}
              id="edit-asset-file"
              type="file"
              accept={accept}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              className={fileFieldClass(Boolean(fieldErrors.file))}
              aria-invalid={Boolean(fieldErrors.file)}
              aria-describedby={fieldErrors.file ? 'edit-asset-file-error' : undefined}
            />
            <p className="mt-1 truncate text-xs text-slate-500">
              {file ? `New file: ${file.name}` : 'Leave empty to keep the current file.'}
            </p>
            {fieldErrors.file ? (
              <p id="edit-asset-file-error" className="mt-1 text-xs text-red-600">
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
            <label htmlFor="edit-asset-name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="edit-asset-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                clearFieldError('name')
              }}
              className={fieldClass(Boolean(fieldErrors.name))}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'edit-asset-name-error' : undefined}
            />
            {fieldErrors.name ? (
              <p id="edit-asset-name-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="edit-asset-folder" className="mb-1 block text-sm font-medium text-slate-700">
              Folder
            </label>
            <select
              id="edit-asset-folder"
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
                <label htmlFor="edit-asset-tags" className="mb-1 block text-sm font-medium text-slate-700">
                  Tags
                </label>
                <input
                  id="edit-asset-tags"
                  value={tagsText}
                  onChange={(event) => {
                    setTagsText(event.target.value)
                    clearFieldError('tags')
                  }}
                  placeholder="campaign, social, product"
                  className={fieldClass(Boolean(fieldErrors.tags))}
                  aria-invalid={Boolean(fieldErrors.tags)}
                  aria-describedby={fieldErrors.tags ? 'edit-asset-tags-error' : undefined}
                />
                {fieldErrors.tags ? (
                  <p id="edit-asset-tags-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.tags}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="edit-asset-description"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="edit-asset-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                    clearFieldError('description')
                  }}
                  rows={2}
                  className={fieldClass(Boolean(fieldErrors.description))}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={
                    fieldErrors.description ? 'edit-asset-description-error' : undefined
                  }
                />
                {fieldErrors.description ? (
                  <p id="edit-asset-description-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.description}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="edit-asset-usage" className="mb-1 block text-sm font-medium text-slate-700">
                  Usage suggestion
                </label>
                <textarea
                  id="edit-asset-usage"
                  value={usageSuggestion}
                  onChange={(event) => {
                    setUsageSuggestion(event.target.value)
                    clearFieldError('usage_suggestion')
                  }}
                  rows={2}
                  className={fieldClass(Boolean(fieldErrors.usage_suggestion))}
                  aria-invalid={Boolean(fieldErrors.usage_suggestion)}
                  aria-describedby={
                    fieldErrors.usage_suggestion ? 'edit-asset-usage-error' : undefined
                  }
                />
                {fieldErrors.usage_suggestion ? (
                  <p id="edit-asset-usage-error" className="mt-1 text-xs text-red-600">
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
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
