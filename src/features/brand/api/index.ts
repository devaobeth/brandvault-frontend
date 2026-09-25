import { api } from '@/shared/api/client'
import type { Brand } from '@/shared/types/api'

export async function getBrand() {
  const { data } = await api.get<{ brand: Brand }>('/api/brand')
  return data.brand
}

export async function createBrand(payload: {
  name: string
  primary_color: string
  secondary_color: string
  logo_url?: string | null
  default_font?: string | null
}) {
  const { data } = await api.post<{ brand: Brand }>('/api/brand', payload)
  return data.brand
}

export async function updateBrand(
  payload: Partial<{
    name: string
    primary_color: string
    secondary_color: string
    logo_url: string | null
    default_font: string | null
  }>,
) {
  const { data } = await api.patch<{ brand: Brand }>('/api/brand', payload)
  return data.brand
}

export async function uploadBrandLogo(file: File) {
  const formData = new FormData()
  formData.append('logo', file)

  const { data } = await api.post<{ brand: Brand; message: string }>(
    '/api/brand/logo',
    formData,
  )

  return data.brand
}
