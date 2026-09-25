import { useEffect, useState, type FormEvent } from 'react'
import type { Asset } from '@/shared/types/api'
import {
  parseTags,
  validateRequiredLongText,
  validateTags,
} from '@/features/assets/lib/validation'
import { fieldClass } from '@/shared/lib/formField'
import { Spinner } from '@/shared/components/Spinner'

export type AiSuggestion = {
  tags: string[]
  description: string
  usage_suggestion: string
}

type GenerateTagsModalProps = {
  asset: Asset | null
  loading: boolean
  saving: boolean
  error: string | null
  suggestion: AiSuggestion | null
  onClose: () => void
  onRegenerate: () => void
  onSave: (suggestion: AiSuggestion) => Promise<void>
}

type FieldErrors = {
  tags?: string
  description?: string
  usage_suggestion?: string
}

export function GenerateTagsModal({
  asset,
  loading,
  saving,
  error,
  suggestion,
  onClose,
  onRegenerate,
  onSave,
}: GenerateTagsModalProps) {
  const [tagsText, setTagsText] = useState('')
  const [description, setDescription] = useState('')
  const [usageSuggestion, setUsageSuggestion] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!suggestion) {
      setTagsText('')
      setDescription('')
      setUsageSuggestion('')
      return
    }
    setTagsText(suggestion.tags.join(', '))
    setDescription(suggestion.description)
    setUsageSuggestion(suggestion.usage_suggestion)
    setFieldErrors({})
    setFormError(null)
  }, [suggestion])

  useEffect(() => {
    if (!asset) {
      return
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving && !loading) {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [asset, loading, onClose, saving])

  if (!asset) {
    return null
  }

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const tags = parseTags(tagsText)
    const next: FieldErrors = {}

    if (tags.length === 0) {
      next.tags = 'Add at least one tag.'
    } else {
      const tagsError = validateTags(tags)
      if (tagsError) {
        next.tags = tagsError
      }
    }

    const descriptionError = validateRequiredLongText(description, 'Description')
    if (descriptionError) {
      next.description = descriptionError
    }

    const usageError = validateRequiredLongText(usageSuggestion, 'Usage suggestion')
    if (usageError) {
      next.usage_suggestion = usageError
    }

    setFieldErrors(next)
    setFormError(null)
    if (Object.keys(next).length > 0) {
      return
    }

    try {
      await onSave({
        tags,
        description: description.trim(),
        usage_suggestion: usageSuggestion.trim(),
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save tags.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={() => {
        if (!saving && !loading) {
          onClose()
        }
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-tags-title"
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="generate-tags-title" className="text-lg font-semibold text-slate-900">
          Generate Tags
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review AI suggestions for “{asset.name}” before saving.
        </p>

        {loading && !suggestion ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-slate-500">Generating with Gemini…</p>
          </div>
        ) : null}

        {error && !suggestion ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onRegenerate}
                className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {suggestion ? (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4" noValidate>
            {error ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {error}
              </p>
            ) : null}

            <div>
              <label htmlFor="ai-tags" className="mb-1 block text-sm font-medium text-slate-700">
                Tags
              </label>
              <input
                id="ai-tags"
                value={tagsText}
                onChange={(event) => {
                  setTagsText(event.target.value)
                  clearFieldError('tags')
                }}
                placeholder="campaign, social, product"
                className={fieldClass(Boolean(fieldErrors.tags))}
                aria-invalid={Boolean(fieldErrors.tags)}
                aria-describedby={fieldErrors.tags ? 'ai-tags-error' : undefined}
              />
              {fieldErrors.tags ? (
                <p id="ai-tags-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.tags}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Comma-separated</p>
              )}
            </div>

            <div>
              <label
                htmlFor="ai-description"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Description
              </label>
              <textarea
                id="ai-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value)
                  clearFieldError('description')
                }}
                rows={3}
                className={fieldClass(Boolean(fieldErrors.description))}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? 'ai-description-error' : undefined}
              />
              {fieldErrors.description ? (
                <p id="ai-description-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.description}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="ai-usage"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Usage suggestion
              </label>
              <textarea
                id="ai-usage"
                value={usageSuggestion}
                onChange={(event) => {
                  setUsageSuggestion(event.target.value)
                  clearFieldError('usage_suggestion')
                }}
                rows={2}
                className={fieldClass(Boolean(fieldErrors.usage_suggestion))}
                aria-invalid={Boolean(fieldErrors.usage_suggestion)}
                aria-describedby={
                  fieldErrors.usage_suggestion ? 'ai-usage-error' : undefined
                }
              />
              {fieldErrors.usage_suggestion ? (
                <p id="ai-usage-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.usage_suggestion}
                </p>
              ) : null}
            </div>

            {formError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={saving || loading}
                onClick={onClose}
                className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={saving || loading}
                onClick={onRegenerate}
                className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? 'Regenerating…' : 'Regenerate'}
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
