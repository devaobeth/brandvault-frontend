import { api } from '@/shared/api/client'
import type { Asset } from '@/shared/types/api'

export async function listAssets(params?: {
  folder_id?: number | null | ''
  q?: string
  sort?: 'updated_desc' | 'name_asc'
  trash?: boolean
}) {
  const { data } = await api.get<{ assets: Asset[] }>('/api/assets', { params })
  return data.assets
}

export async function createAsset(payload: {
  file?: File
  name?: string
  type?: Asset['type']
  url?: string
  folder_id?: number | null
  tags?: string[]
  description?: string
  usage_suggestion?: string
}) {
  if (payload.file) {
    const formData = new FormData()
    formData.append('file', payload.file)
    if (payload.name) {
      formData.append('name', payload.name)
    }
    if (payload.type) {
      formData.append('type', payload.type)
    }
    if (payload.folder_id !== undefined && payload.folder_id !== null) {
      formData.append('folder_id', String(payload.folder_id))
    }
    if (payload.tags !== undefined) {
      formData.append('tags', JSON.stringify(payload.tags))
    }
    if (payload.description !== undefined) {
      formData.append('description', payload.description ?? '')
    }
    if (payload.usage_suggestion !== undefined) {
      formData.append('usage_suggestion', payload.usage_suggestion ?? '')
    }

    const { data } = await api.post<{ asset: Asset }>('/api/assets', formData)
    return data.asset
  }

  const body: Record<string, unknown> = {
    name: payload.name,
    type: payload.type,
    url: payload.url,
    folder_id: payload.folder_id ?? null,
  }
  if (payload.tags !== undefined) {
    body.tags = payload.tags
  }
  if (payload.description !== undefined) {
    body.description = payload.description || null
  }
  if (payload.usage_suggestion !== undefined) {
    body.usage_suggestion = payload.usage_suggestion || null
  }

  const { data } = await api.post<{ asset: Asset }>('/api/assets', body)
  return data.asset
}

export async function updateAsset(
  id: number,
  payload: {
    name?: string
    file?: File
    folder_id?: number | null
    tags?: string[] | null
    description?: string | null
    usage_suggestion?: string | null
  },
) {
  if (!payload.file) {
    const body: Record<string, unknown> = {}
    if (payload.name !== undefined) {
      body.name = payload.name
    }
    if (payload.folder_id !== undefined) {
      body.folder_id = payload.folder_id
    }
    if (payload.tags !== undefined) {
      body.tags = payload.tags
    }
    if (payload.description !== undefined) {
      body.description = payload.description
    }
    if (payload.usage_suggestion !== undefined) {
      body.usage_suggestion = payload.usage_suggestion
    }

    const { data } = await api.patch<{ asset: Asset }>(`/api/assets/${id}`, body)
    return data.asset
  }

  const formData = new FormData()
  if (payload.name !== undefined) {
    formData.append('name', payload.name)
  }
  formData.append('file', payload.file)
  if (payload.folder_id !== undefined) {
    formData.append(
      'folder_id',
      payload.folder_id === null ? '' : String(payload.folder_id),
    )
  }
  if (payload.tags !== undefined) {
    formData.append('tags', JSON.stringify(payload.tags ?? []))
  }
  if (payload.description !== undefined) {
    formData.append('description', payload.description ?? '')
  }
  if (payload.usage_suggestion !== undefined) {
    formData.append('usage_suggestion', payload.usage_suggestion ?? '')
  }

  // POST so PHP parses multipart file uploads (PATCH often drops files)
  const { data } = await api.post<{ asset: Asset }>(`/api/assets/${id}`, formData)
  return data.asset
}

export async function generateAssetTags(id: number) {
  const { data } = await api.post<{
    suggestion: {
      tags: string[]
      description: string
      usage_suggestion: string
    }
  }>(`/api/assets/${id}/generate-tags`)
  return data.suggestion
}

export async function suggestAssetTags(payload: {
  name: string
  type: Asset['type']
  file: File
  folder_id?: number | null
}) {
  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('type', payload.type)
  formData.append('file', payload.file)
  if (payload.folder_id !== undefined && payload.folder_id !== null) {
    formData.append('folder_id', String(payload.folder_id))
  }

  const { data } = await api.post<{
    suggestion: {
      tags: string[]
      description: string
      usage_suggestion: string
    }
  }>('/api/assets/suggest-tags', formData)
  return data.suggestion
}

export async function trashAsset(id: number) {
  const { data } = await api.post<{ message: string; asset: Asset }>(
    `/api/assets/${id}/trash`,
  )
  return data.asset
}

export async function restoreAsset(id: number) {
  const { data } = await api.post<{ message: string; asset: Asset }>(
    `/api/assets/${id}/restore`,
  )
  return data.asset
}
