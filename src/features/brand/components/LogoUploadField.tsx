import { useEffect, useState, type ChangeEvent } from 'react'

export const LOGO_MAX_BYTES = 2 * 1024 * 1024

export const LOGO_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const

type LogoUploadFieldProps = {
  currentLogoUrl: string
  onFileChange: (file: File | null, previewUrl: string) => void
  error?: string
}

export function validateLogoFile(file: File): string | null {
  if (!LOGO_ALLOWED_TYPES.includes(file.type as (typeof LOGO_ALLOWED_TYPES)[number])) {
    return 'Only image files are allowed (jpg, png, webp, gif, svg).'
  }

  if (file.size > LOGO_MAX_BYTES) {
    return 'Logo must be 2MB or smaller.'
  }

  return null
}

export function LogoUploadField({
  currentLogoUrl,
  onFileChange,
  error,
}: LogoUploadFieldProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setLocalError(null)

    if (!file) {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
      setLocalPreview(null)
      onFileChange(null, currentLogoUrl)
      return
    }

    const validationError = validateLogoFile(file)
    if (validationError) {
      setLocalError(validationError)
      event.target.value = ''
      onFileChange(null, currentLogoUrl)
      return
    }

    if (localPreview) {
      URL.revokeObjectURL(localPreview)
    }

    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)
    onFileChange(file, previewUrl)
  }

  function clearSelection() {
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
    }
    setLocalPreview(null)
    setLocalError(null)
    onFileChange(null, currentLogoUrl)
  }

  const previewSrc = localPreview || currentLogoUrl
  const shownError = error || localError

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">Logo (optional)</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {previewSrc ? (
            <img src={previewSrc} alt="Logo preview" className="h-full w-full object-contain" />
          ) : (
            <span className="px-2 text-center text-xs text-slate-400">No logo</span>
          )}
        </div>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.svg"
            onChange={handleChange}
            className="block w-full cursor-pointer text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          <p className="text-xs text-slate-500">Images only · max 2MB · jpg, png, webp, gif, svg</p>
          {localPreview ? (
            <button
              type="button"
              onClick={clearSelection}
              className="cursor-pointer text-xs text-slate-600 underline"
            >
              Clear selected file
            </button>
          ) : null}
        </div>
      </div>
      {shownError ? <p className="text-xs text-red-600">{shownError}</p> : null}
    </div>
  )
}
