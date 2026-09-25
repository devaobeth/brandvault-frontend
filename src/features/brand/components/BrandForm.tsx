import { useEffect, useState, type FormEvent } from 'react'
import { ColorField, isValidHex } from '@/features/brand/components/ColorField'
import { LogoUploadField, validateLogoFile } from '@/features/brand/components/LogoUploadField'
import { ErrorState } from '@/shared/components/ErrorState'

export type BrandFormValues = {
  name: string
  primary_color: string
  secondary_color: string
  logo_url: string
  default_font: string
}

export type BrandFormSubmitPayload = {
  values: BrandFormValues
  logoFile: File | null
}

type BrandFormProps = {
  initialValues: BrandFormValues
  mode: 'create' | 'edit'
  submitting: boolean
  onChange: (values: BrandFormValues) => void
  onSubmit: (payload: BrandFormSubmitPayload) => Promise<void>
}

type FieldErrors = Partial<Record<keyof BrandFormValues | 'logo', string>>

export function BrandForm({
  initialValues,
  mode,
  submitting,
  onChange,
  onSubmit,
}: BrandFormProps) {
  const [values, setValues] = useState<BrandFormValues>(initialValues)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    onChange(values)
  }, [onChange, values])

  function updateField<K extends keyof BrandFormValues>(key: K, value: BrandFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleLogoChange(file: File | null, previewUrl: string) {
    setLogoFile(file)
    setValues((current) => ({ ...current, logo_url: previewUrl }))
    setFieldErrors((current) => ({ ...current, logo: undefined }))
  }

  function validate(next: BrandFormValues, file: File | null): FieldErrors {
    const errors: FieldErrors = {}

    if (!next.name.trim()) {
      errors.name = 'Brand name is required.'
    }
    if (!isValidHex(next.primary_color.trim())) {
      errors.primary_color = 'Use a valid hex color like #1A73E8.'
    }
    if (!isValidHex(next.secondary_color.trim())) {
      errors.secondary_color = 'Use a valid hex color like #34A853.'
    }
    if (file) {
      const logoError = validateLogoFile(file)
      if (logoError) {
        errors.logo = logoError
      }
    }

    return errors
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const nextValues: BrandFormValues = {
      name: values.name.trim(),
      primary_color: values.primary_color.trim().toUpperCase(),
      secondary_color: values.secondary_color.trim().toUpperCase(),
      logo_url: values.logo_url.trim(),
      default_font: values.default_font.trim(),
    }

    const errors = validate(nextValues, logoFile)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      await onSubmit({ values: nextValues, logoFile })
    } catch {
      setFormError(mode === 'create' ? 'Could not create brand.' : 'Could not update brand.')
    }
  }

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Brand name</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          value={values.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />
        {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
      </label>

      <ColorField
        label="Primary color"
        value={values.primary_color}
        onChange={(value) => updateField('primary_color', value)}
        error={fieldErrors.primary_color}
      />

      <ColorField
        label="Secondary color"
        value={values.secondary_color}
        onChange={(value) => updateField('secondary_color', value)}
        error={fieldErrors.secondary_color}
      />

      <LogoUploadField
        currentLogoUrl={initialValues.logo_url}
        onFileChange={handleLogoChange}
        error={fieldErrors.logo}
      />

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Default font (optional)</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          value={values.default_font}
          onChange={(e) => updateField('default_font', e.target.value)}
          placeholder="Inter"
        />
      </label>

      {formError ? <ErrorState message={formError} /> : null}

      <button
        type="submit"
        disabled={submitting}
        className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Saving…' : mode === 'create' ? 'Create brand' : 'Save changes'}
      </button>
    </form>
  )
}
