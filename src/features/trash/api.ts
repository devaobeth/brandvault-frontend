import { api } from '@/shared/api/client'
import type { Asset, Folder } from '@/shared/types/api'
import { restoreAsset } from '@/features/assets/api/assets'

export { restoreAsset }

export type TrashEntry =
  | { kind: 'asset'; key: string; id: number; name: string; deleted_at: string | null; asset: Asset }
  | { kind: 'folder'; key: string; id: number; name: string; deleted_at: string | null; folder: Folder }

function trashKey(kind: 'asset' | 'folder', id: number) {
  return `${kind}:${id}`
}

export async function listTrash(params?: {
  q?: string
  sort?: 'updated_desc' | 'name_asc'
}): Promise<TrashEntry[]> {
  const [assetsRes, foldersRes] = await Promise.all([
    api.get<{ assets: Asset[] }>('/api/assets', {
      params: { trash: true, ...params },
    }),
    api.get<{ folders: Folder[] }>('/api/folders', {
      params: { trash: true, ...params },
    }),
  ])

  const folders: TrashEntry[] = foldersRes.data.folders.map((folder) => ({
    kind: 'folder' as const,
    key: trashKey('folder', folder.id),
    id: folder.id,
    name: folder.name,
    deleted_at: folder.deleted_at,
    folder,
  }))

  const assets: TrashEntry[] = assetsRes.data.assets.map((asset) => ({
    kind: 'asset' as const,
    key: trashKey('asset', asset.id),
    id: asset.id,
    name: asset.name,
    deleted_at: asset.deleted_at,
    asset,
  }))

  const merged = [...folders, ...assets]

  if (params?.sort === 'name_asc') {
    merged.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    merged.sort((a, b) => {
      const aTime = a.deleted_at ? new Date(a.deleted_at).getTime() : 0
      const bTime = b.deleted_at ? new Date(b.deleted_at).getTime() : 0
      return bTime - aTime
    })
  }

  return merged
}

export async function restoreFolder(id: number) {
  const { data } = await api.post<{ message: string; folder: Folder }>(
    `/api/folders/${id}/restore`,
  )
  return data
}

export async function forceDeleteAsset(id: number) {
  const { data } = await api.delete<{ message: string }>(`/api/assets/${id}`)
  return data
}

export async function forceDeleteFolder(id: number) {
  const { data } = await api.delete<{ message: string }>(
    `/api/folders/${id}/force`,
  )
  return data
}

export async function emptyTrash() {
  const { data } = await api.delete<{ message: string; deleted: number }>(
    '/api/assets/trash',
  )
  return data
}
