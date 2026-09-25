import { api } from '@/shared/api/client'
import type { Folder } from '@/shared/types/api'

export async function listFolders(parentId?: number | null) {
  const params =
    parentId === undefined || parentId === null
      ? undefined
      : { parent_id: parentId }
  const { data } = await api.get<{ folders: Folder[] }>('/api/folders', { params })
  return data.folders
}

export async function createFolder(name: string, parentId?: number | null) {
  const { data } = await api.post<{ folder: Folder }>('/api/folders', {
    name,
    parent_id: parentId ?? null,
  })
  return data.folder
}

export async function updateFolder(
  id: number,
  payload: Partial<{ name: string; parent_id: number | null }>,
) {
  const { data } = await api.patch<{ folder: Folder }>(`/api/folders/${id}`, payload)
  return data.folder
}

export async function deleteFolder(id: number) {
  const { data } = await api.delete<{ message: string }>(`/api/folders/${id}`)
  return data
}
