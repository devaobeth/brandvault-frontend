import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import {
  createBrand,
  getBrand,
  updateBrand,
  uploadBrandLogo,
} from '@/features/brand/api'
import {
  BrandForm,
  type BrandFormSubmitPayload,
  type BrandFormValues,
} from '@/features/brand/components/BrandForm'
import { BrandPreview } from '@/features/brand/components/BrandPreview'
import { ErrorState } from '@/shared/components/ErrorState'
import { Spinner } from '@/shared/components/Spinner'
import { SuccessAlert } from '@/shared/components/SuccessAlert'
import type { Brand } from '@/shared/types/api'

const CREATE_DEFAULTS: BrandFormValues = {
  name: '',
  primary_color: '#1A73E8',
  secondary_color: '#34A853',
  logo_url: '',
  default_font: '',
}

function brandToFormValues(brand: Brand): BrandFormValues {
  return {
    name: brand.name,
    primary_color: brand.primary_color,
    secondary_color: brand.secondary_color,
    logo_url: brand.logo_url ?? '',
    default_font: brand.default_font ?? '',
  }
}

export function BrandPage() {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [preview, setPreview] = useState<BrandFormValues>(CREATE_DEFAULTS)
  const [formValues, setFormValues] = useState<BrandFormValues>(CREATE_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  const loadBrand = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getBrand()
      const values = brandToFormValues(data)
      setBrand(data)
      setFormValues(values)
      setPreview(values)
      setFormKey((key) => key + 1)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setBrand(null)
        setFormValues(CREATE_DEFAULTS)
        setPreview(CREATE_DEFAULTS)
        setFormKey((key) => key + 1)
      } else {
        setError('Could not load brand kit.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBrand()
  }, [loadBrand])

  async function handleSubmit({ values, logoFile }: BrandFormSubmitPayload) {
    setSubmitting(true)
    setSuccess(null)
    setError(null)

    const payload = {
      name: values.name,
      primary_color: values.primary_color,
      secondary_color: values.secondary_color,
      default_font: values.default_font || null,
    }

    try {
      let saved = brand
        ? await updateBrand(payload)
        : await createBrand(payload)

      if (logoFile) {
        saved = await uploadBrandLogo(logoFile)
      }

      const next = brandToFormValues(saved)
      setBrand(saved)
      setFormValues(next)
      setPreview(next)
      setFormKey((key) => key + 1)
      setSuccess(
        logoFile
          ? brand
            ? 'Brand and logo updated.'
            : 'Brand created and logo uploaded.'
          : brand
            ? 'Brand updated.'
            : 'Brand created.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Spinner />
  }

  if (error && !brand) {
    return (
      <div className="space-y-4">
        <ErrorState message={error} />
        <button
          type="button"
          onClick={() => void loadBrand()}
          className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  const mode = brand ? 'edit' : 'create'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Brand kit</h1>
        <p className="text-sm text-slate-500">
          {mode === 'create'
            ? 'Create your workspace brand profile.'
            : 'Update name, colors, logo, and font.'}
        </p>
      </div>

      {success ? (
        <SuccessAlert message={success} onClose={() => setSuccess(null)} />
      ) : null}
      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <BrandForm
          key={formKey}
          initialValues={formValues}
          mode={mode}
          submitting={submitting}
          onChange={setPreview}
          onSubmit={handleSubmit}
        />
        <BrandPreview
          name={preview.name}
          primaryColor={preview.primary_color}
          secondaryColor={preview.secondary_color}
          logoUrl={preview.logo_url}
          defaultFont={preview.default_font}
        />
      </div>
    </div>
  )
}
