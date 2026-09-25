import axios from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createAsset,
  createFolder,
  deleteFolder,
  generateAssetTags,
  listAssets,
  listFolders,
  suggestAssetTags,
  trashAsset,
  updateAsset,
  updateFolder,
} from '@/features/assets/api'
import { AssetContextMenu, type AssetContextMenuState } from '@/features/assets/components/AssetContextMenu'
import { AssetGrid } from '@/features/assets/components/AssetGrid'
import { AssetInfoModal } from '@/features/assets/components/AssetInfoModal'
import {
  AssetPreviewModal,
} from '@/features/assets/components/AssetPreviewModal'
import { AssetToolbar, type AssetSort, type TypeFilter } from '@/features/assets/components/AssetToolbar'
import {
  AddAssetModal,
  type AddAssetFormValues,
} from '@/features/assets/components/AddAssetModal'
import {
  EditAssetModal,
  type EditAssetFormValues,
} from '@/features/assets/components/EditAssetModal'
import { CreateFolderModal } from '@/features/assets/components/CreateFolderModal'
import {
  FolderContextMenu,
  type FolderContextMenuState,
  type FolderContextTarget,
} from '@/features/assets/components/FolderContextMenu'
import { FolderTree } from '@/features/assets/components/FolderTree'
import { RenameAssetModal } from '@/features/assets/components/RenameAssetModal'
import { RenameFolderModal } from '@/features/assets/components/RenameFolderModal'
import { SubfolderList } from '@/features/assets/components/SubfolderList'
import { ConfirmModal, type ConfirmDialogState } from '@/shared/components/ConfirmModal'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { Spinner } from '@/shared/components/Spinner'
import { SuccessAlert } from '@/shared/components/SuccessAlert'
import type { Asset, AssetType, Folder } from '@/shared/types/api'

const ASSET_FILE_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.gif,.svg,.mp4,.webm,.mov,.pdf,.doc,.docx,.txt,.rtf,.ttf,.otf,.woff,.woff2'

function apiMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const firstField = body?.errors
      ? Object.values(body.errors).flat()[0]
      : undefined
    return firstField || body?.message || fallback
  }
  return fallback
}

function isDescendantOf(
  ancestorId: number,
  nodeId: number,
  parentById: Record<number, number | null>,
) {
  let current: number | null = nodeId
  while (current !== null) {
    if (current === ancestorId) {
      return true
    }
    current = parentById[current] ?? null
  }
  return false
}

type Crumb = { id: number | null; name: string }

export function AssetsPage() {
  const [rootFolders, setRootFolders] = useState<Folder[]>([])
  const [childrenByParent, setChildrenByParent] = useState<Record<string, Folder[]>>({})
  const [parentById, setParentById] = useState<Record<number, number | null>>({})
  const [nameById, setNameById] = useState<Record<number, string>>({})
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [subfolders, setSubfolders] = useState<Folder[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sort, setSort] = useState<AssetSort>('updated_desc')

  const [treeLoading, setTreeLoading] = useState(true)
  const [paneLoading, setPaneLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderSubmitting, setFolderSubmitting] = useState(false)
  const [createParentId, setCreateParentId] = useState<number | null>(null)
  const [addAssetOpen, setAddAssetOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<FolderContextMenuState | null>(null)
  const [assetSubmitting, setAssetSubmitting] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [assetMenu, setAssetMenu] = useState<AssetContextMenuState | null>(null)
  const [renameAsset, setRenameAsset] = useState<Asset | null>(null)
  const [renameSubmitting, setRenameSubmitting] = useState(false)
  const [renameFolder, setRenameFolder] = useState<Folder | null>(null)
  const [renameFolderSubmitting, setRenameFolderSubmitting] = useState(false)
  const [infoAsset, setInfoAsset] = useState<Asset | null>(null)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [draggingAssetId, setDraggingAssetId] = useState<number | null>(null)
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null)
  const draggingIdRef = useRef<number | null>(null)
  const draggingAssetIdRef = useRef<number | null>(null)

  function beginDrag(folderId: number) {
    draggingAssetIdRef.current = null
    setDraggingAssetId(null)
    draggingIdRef.current = folderId
    setDraggingId(folderId)
  }

  function beginAssetDrag(assetId: number) {
    draggingIdRef.current = null
    setDraggingId(null)
    draggingAssetIdRef.current = assetId
    setDraggingAssetId(assetId)
  }

  function endDrag() {
    draggingIdRef.current = null
    draggingAssetIdRef.current = null
    setDraggingId(null)
    setDraggingAssetId(null)
    setDropTargetKey(null)
  }

  const rememberFolders = useCallback((folders: Folder[]) => {
    setParentById((current) => {
      const next = { ...current }
      for (const folder of folders) {
        next[folder.id] = folder.parent_id
      }
      return next
    })
    setNameById((current) => {
      const next = { ...current }
      for (const folder of folders) {
        next[folder.id] = folder.name
      }
      return next
    })
  }, [])

  /** Prefetch the whole tree (max depth 3) so nested folders show without manual expand. */
  const loadFullTree = useCallback(async () => {
    const byParent: Record<string, Folder[]> = {}
    const expand = new Set<number>()

    async function walk(parentId: number | null, remainingDepth: number) {
      const folders =
        parentId === null ? await listFolders() : await listFolders(parentId)

      if (parentId === null) {
        setRootFolders(folders)
      } else {
        byParent[String(parentId)] = folders
        if (folders.length > 0) {
          expand.add(parentId)
        }
      }

      rememberFolders(folders)

      if (remainingDepth <= 0 || folders.length === 0) {
        return
      }

      await Promise.all(
        folders.map((folder) => walk(folder.id, remainingDepth - 1)),
      )
    }

    await walk(null, 3)
    setChildrenByParent(byParent)
    setExpandedIds(expand)
  }, [rememberFolders])

  const refreshTree = useCallback(async () => {
    await loadFullTree()
  }, [loadFullTree])

  const loadChildren = useCallback(
    async (parentId: number) => {
      const folders = await listFolders(parentId)
      setChildrenByParent((current) => ({
        ...current,
        [String(parentId)]: folders,
      }))
      rememberFolders(folders)
      if (folders.length > 0) {
        setExpandedIds((current) => new Set(current).add(parentId))
      }
      return folders
    },
    [rememberFolders],
  )

  const loadPane = useCallback(
    async (folderId: number | null, q: string, sortValue: AssetSort) => {
      setPaneLoading(true)
      setError(null)
      try {
        const [folders, assetList] = await Promise.all([
          folderId === null ? listFolders() : listFolders(folderId),
          listAssets({
            folder_id: folderId === null ? '' : folderId,
            q: q || undefined,
            sort: sortValue,
          }),
        ])
        setSubfolders(folders)
        setAssets(assetList)
        rememberFolders(folders)
        if (folderId === null) {
          setRootFolders(folders)
        } else {
          setChildrenByParent((current) => ({
            ...current,
            [String(folderId)]: folders,
          }))
        }
      } catch (err) {
        setError(apiMessage(err, 'Could not load folder contents.'))
      } finally {
        setPaneLoading(false)
      }
    },
    [rememberFolders],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setTreeLoading(true)
      setError(null)
      try {
        await loadFullTree()
      } catch (err) {
        if (!cancelled) {
          setError(apiMessage(err, 'Could not load folders.'))
        }
      } finally {
        if (!cancelled) {
          setTreeLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadFullTree])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (treeLoading) {
      return
    }
    void loadPane(selectedId, debouncedQuery, sort)
  }, [debouncedQuery, loadPane, selectedId, sort, treeLoading])

  const breadcrumbs: Crumb[] = useMemo(() => {
    const crumbs: Crumb[] = [{ id: null, name: 'Home' }]
    if (selectedId === null) {
      return crumbs
    }
    const chain: number[] = []
    let current: number | null = selectedId
    while (current !== null) {
      chain.unshift(current)
      current = parentById[current] ?? null
    }
    for (const id of chain) {
      crumbs.push({ id, name: nameById[id] ?? `Folder ${id}` })
    }
    return crumbs
  }, [nameById, parentById, selectedId])

  const filteredAssets = useMemo(() => {
    if (typeFilter === 'all') {
      return assets
    }
    return assets.filter((asset) => asset.type === typeFilter)
  }, [assets, typeFilter])

  const createParentLabel =
    createParentId === null ? 'Home' : (nameById[createParentId] ?? 'folder')

  const addAssetFolderOptions = useMemo(() => {
    const options: { id: number | null; label: string }[] = [{ id: null, label: 'Home' }]
    const entries = Object.entries(nameById)
      .map(([id, name]) => ({ id: Number(id), label: name }))
      .sort((a, b) => a.label.localeCompare(b.label))
    return options.concat(entries)
  }, [nameById])

  function openCreateFolder(parentId: number | null) {
    setCreateParentId(parentId)
    setFolderModalOpen(true)
  }

  function handleTreeContextMenu(
    event: { clientX: number; clientY: number },
    target: FolderContextTarget,
  ) {
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target,
    })
  }

  async function handleToggle(folderId: number) {
    const next = new Set(expandedIds)
    if (next.has(folderId)) {
      next.delete(folderId)
      setExpandedIds(next)
      return
    }
    next.add(folderId)
    setExpandedIds(next)
    if (!childrenByParent[String(folderId)]) {
      try {
        await loadChildren(folderId)
      } catch (err) {
        setError(apiMessage(err, 'Could not load subfolders.'))
      }
    }
  }

  function handleSelect(folderId: number | null) {
    setSelectedId(folderId)
  }

  async function handleCreateFolder(name: string) {
    setFolderSubmitting(true)
    try {
      const parentId = createParentId
      await createFolder(name, parentId)
      await refreshTree()
      if (parentId !== null) {
        setExpandedIds((current) => new Set(current).add(parentId))
      }
      await loadPane(selectedId, debouncedQuery, sort)
      setFolderModalOpen(false)
      setSuccess('Folder created.')
    } catch (err) {
      throw new Error(apiMessage(err, 'Could not create folder.'))
    } finally {
      setFolderSubmitting(false)
    }
  }

  async function performDeleteFolder(folder: Folder) {
    setConfirmBusy(true)
    try {
      await deleteFolder(folder.id)
      const parentId = parentById[folder.id] ?? null
      const selectionInside =
        selectedId !== null &&
        (selectedId === folder.id || isDescendantOf(folder.id, selectedId, parentById))
      if (selectionInside) {
        setSelectedId(parentId)
      }
      await refreshTree()
      setChildrenByParent((current) => {
        const next = { ...current }
        delete next[String(folder.id)]
        return next
      })
      if (!selectionInside) {
        await loadPane(selectedId, debouncedQuery, sort)
      }
      setConfirmDialog(null)
      setSuccess('Folder deleted.')
    } catch (err) {
      setError(apiMessage(err, 'Could not delete folder.'))
      setConfirmDialog(null)
    } finally {
      setConfirmBusy(false)
    }
  }

  function requestDeleteFolder(folder: Folder) {
    setConfirmDialog({
      title: 'Delete folder?',
      message: `Delete “${folder.name}” and its contents? This cannot be undone from here.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => performDeleteFolder(folder),
    })
  }

  function handleDeleteFromMenu(folderId: number, folderName: string) {
    requestDeleteFolder({
      id: folderId,
      name: folderName,
      workspace_id: 0,
      parent_id: parentById[folderId] ?? null,
      created_at: '',
      updated_at: '',
    })
  }

  function handleRenameFromMenu(folderId: number, folderName: string) {
    setRenameFolder({
      id: folderId,
      name: folderName,
      workspace_id: 0,
      parent_id: parentById[folderId] ?? null,
      created_at: '',
      updated_at: '',
    })
  }

  function handleSubfolderContextMenu(
    event: { clientX: number; clientY: number },
    folder: Folder,
  ) {
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target: {
        kind: 'folder',
        folderId: folder.id,
        folderName: folder.name,
      },
    })
  }

  async function handleRenameFolder(name: string) {
    if (!renameFolder) {
      return
    }
    setRenameFolderSubmitting(true)
    try {
      await updateFolder(renameFolder.id, { name })
      setNameById((current) => ({ ...current, [renameFolder.id]: name }))
      await refreshTree()
      await loadPane(selectedId, debouncedQuery, sort)
      setRenameFolder(null)
      setSuccess('Folder renamed.')
    } catch (err) {
      throw new Error(apiMessage(err, 'Could not rename folder.'))
    } finally {
      setRenameFolderSubmitting(false)
    }
  }

  async function handleMoveFolder(targetParentId: number | null) {
    const draggedId = draggingIdRef.current
    setDropTargetKey(null)
    draggingIdRef.current = null
    setDraggingId(null)

    if (draggedId === null) {
      return
    }

    if (draggedId === targetParentId) {
      return
    }
    if (
      targetParentId !== null &&
      isDescendantOf(draggedId, targetParentId, parentById)
    ) {
      setError('Cannot move a folder into its own subfolder.')
      return
    }
    if ((parentById[draggedId] ?? null) === targetParentId) {
      return
    }

    try {
      await updateFolder(draggedId, { parent_id: targetParentId })
      setParentById((current) => ({ ...current, [draggedId]: targetParentId }))
      await refreshTree()
      if (targetParentId !== null) {
        setExpandedIds((current) => new Set(current).add(targetParentId))
      }
      await loadPane(selectedId, debouncedQuery, sort)
      setSuccess('Folder moved.')
    } catch (err) {
      setError(apiMessage(err, 'Could not move folder.'))
    }
  }

  async function handleMoveAsset(targetFolderId: number | null) {
    const assetId = draggingAssetIdRef.current
    setDropTargetKey(null)
    draggingAssetIdRef.current = null
    setDraggingAssetId(null)

    if (assetId === null) {
      return
    }

    const current = assets.find((asset) => asset.id === assetId)
    if (current && (current.folder_id ?? null) === targetFolderId) {
      return
    }

    try {
      await updateAsset(assetId, { folder_id: targetFolderId })
      await loadPane(selectedId, debouncedQuery, sort)
      setSuccess(
        targetFolderId === null
          ? 'File moved to Home.'
          : `File moved to ${nameById[targetFolderId] ?? 'folder'}.`,
      )
    } catch (err) {
      setError(apiMessage(err, 'Could not move file.'))
    }
  }

  function handleDropOnTarget(targetFolderId: number | null) {
    if (draggingAssetIdRef.current !== null) {
      void handleMoveAsset(targetFolderId)
      return
    }
    void handleMoveFolder(targetFolderId)
  }

  async function handleAddAsset(values: AddAssetFormValues) {
    setAssetSubmitting(true)
    setError(null)
    try {
      await createAsset({
        name: values.name,
        type: values.type,
        file: values.file,
        folder_id: values.folder_id,
        tags: values.tags,
        description: values.description || null,
        usage_suggestion: values.usage_suggestion || null,
      })
      setAddAssetOpen(false)
      if (values.folder_id !== selectedId) {
        setSelectedId(values.folder_id)
      } else {
        await loadPane(selectedId, debouncedQuery, sort)
      }
      setSuccess(`Added “${values.name}”.`)
    } catch (err) {
      throw new Error(apiMessage(err, 'Could not add asset.'))
    } finally {
      setAssetSubmitting(false)
    }
  }

  async function handleSuggestTagsForNewAsset(values: {
    name: string
    type: AddAssetFormValues['type']
    file: File
    folder_id: number | null
  }) {
    try {
      return await suggestAssetTags(values)
    } catch (err) {
      throw new Error(apiMessage(err, 'Could not generate tags.'))
    }
  }

  async function handleRenameAsset(name: string) {
    if (!renameAsset) {
      return
    }
    setRenameSubmitting(true)
    try {
      await updateAsset(renameAsset.id, { name })
      await loadPane(selectedId, debouncedQuery, sort)
      setRenameAsset(null)
      setSuccess('Asset renamed.')
    } catch (err) {
      throw new Error(apiMessage(err, 'Could not rename asset.'))
    } finally {
      setRenameSubmitting(false)
    }
  }

  async function handleEditAsset(values: EditAssetFormValues) {
    if (!editAsset) {
      return
    }
    setEditSubmitting(true)
    try {
      await updateAsset(editAsset.id, {
        name: values.name,
        file: values.file,
        folder_id: values.folder_id,
        tags: values.tags,
        description: values.description || null,
        usage_suggestion: values.usage_suggestion || null,
      })
      setEditAsset(null)
      if (values.folder_id !== selectedId) {
        setSelectedId(values.folder_id)
      } else {
        await loadPane(selectedId, debouncedQuery, sort)
      }
      setSuccess(`Updated “${values.name}”.`)
    } catch (err) {
      throw new Error(apiMessage(err, 'Could not update asset.'))
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleSuggestTagsForEditAsset(values: {
    name: string
    type: AssetType
    file?: File
  }) {
    if (!editAsset) {
      throw new Error('No asset selected.')
    }
    try {
      if (values.file) {
        return await suggestAssetTags({
          name: values.name,
          type: values.type,
          file: values.file,
          folder_id: editAsset.folder_id,
        })
      }
      return await generateAssetTags(editAsset.id)
    } catch (err) {
      throw new Error(apiMessage(err, 'Could not generate tags.'))
    }
  }

  async function performTrashAsset(asset: Asset) {
    setConfirmBusy(true)
    try {
      await trashAsset(asset.id)
      await loadPane(selectedId, debouncedQuery, sort)
      setConfirmDialog(null)
      setSuccess('Asset moved to trash.')
    } catch (err) {
      setError(apiMessage(err, 'Could not trash asset.'))
      setConfirmDialog(null)
    } finally {
      setConfirmBusy(false)
    }
  }

  function requestTrashAsset(asset: Asset) {
    setConfirmDialog({
      title: 'Delete file?',
      message: `Delete “${asset.name}”? It will move to Trash.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => performTrashAsset(asset),
    })
  }

  function handleAssetContextMenu(
    event: { clientX: number; clientY: number },
    asset: Asset,
  ) {
    setAssetMenu({
      x: event.clientX,
      y: event.clientY,
      asset,
    })
  }

  if (treeLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-4">
      {success ? (
        <SuccessAlert message={success} onClose={() => setSuccess(null)} />
      ) : null}

      {error ? (
        <ErrorState message={error} />
      ) : null}

      <div className="-mx-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:mx-0 sm:flex">
        <FolderTree
          rootFolders={rootFolders}
          childrenByParent={childrenByParent}
          selectedId={selectedId}
          expandedIds={expandedIds}
          dropTargetKey={dropTargetKey}
          draggingId={draggingId}
          onSelect={handleSelect}
          onToggle={(id) => void handleToggle(id)}
          onCreateClick={() => openCreateFolder(selectedId)}
          onDragStart={beginDrag}
          onDragEnd={endDrag}
          onDragOverTarget={setDropTargetKey}
          onDropOn={(targetId) => handleDropOnTarget(targetId)}
          onContextMenu={handleTreeContextMenu}
        />

        <section className="min-w-0 flex-1 p-4 sm:p-6">
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-slate-500">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <span key={crumb.id ?? 'root'} className="flex items-center gap-1">
                  {index > 0 ? <span className="text-slate-300">›</span> : null}
                  {isLast ? (
                    <span className="font-medium text-slate-800">{crumb.name}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelect(crumb.id)}
                      className="cursor-pointer hover:text-slate-800"
                    >
                      {crumb.name}
                    </button>
                  )}
                </span>
              )
            })}
          </nav>

          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-slate-900">Asset library</h1>
            <p className="text-sm text-slate-500">
              Drag files onto folders (or Home) to move them. Click images, PDFs, or videos to open.
            </p>
          </div>

          <AssetToolbar
            query={query}
            typeFilter={typeFilter}
            sort={sort}
            count={filteredAssets.length + subfolders.length}
            onQueryChange={setQuery}
            onTypeFilterChange={setTypeFilter}
            onSortChange={setSort}
            onNewFolder={() => openCreateFolder(selectedId)}
            onAddAsset={() => setAddAssetOpen(true)}
            adding={assetSubmitting}
          />

          <div className="mt-5">
            {paneLoading ? (
              <Spinner />
            ) : (
              <div
                className="min-h-[12rem] rounded-md border border-slate-100 bg-slate-50/60 p-3"
                onContextMenu={(event) => {
                  if (event.target === event.currentTarget) {
                    event.preventDefault()
                    setContextMenu({
                      x: event.clientX,
                      y: event.clientY,
                      target: { kind: 'blank', parentId: selectedId },
                    })
                  }
                }}
              >
                {subfolders.length === 0 && filteredAssets.length === 0 ? (
                  <EmptyState
                    title="This folder is empty"
                    description="Right-click for New folder, or add an asset."
                  />
                ) : (
                  <div className="flex flex-wrap gap-1">
                    <SubfolderList
                      folders={subfolders}
                      dropTargetKey={dropTargetKey}
                      draggingId={draggingId}
                      onSelect={handleSelect}
                      onDragStart={beginDrag}
                      onDragEnd={endDrag}
                      onDragOverTarget={setDropTargetKey}
                      onDropOn={(targetId) => handleDropOnTarget(targetId)}
                      onContextMenu={handleSubfolderContextMenu}
                    />
                    <AssetGrid
                      assets={filteredAssets}
                      draggingAssetId={draggingAssetId}
                      onOpen={setPreviewAsset}
                      onContextMenu={handleAssetContextMenu}
                      onDragStart={beginAssetDrag}
                      onDragEnd={endDrag}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <FolderContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onNewFolder={(parentId) => openCreateFolder(parentId)}
        onRenameFolder={handleRenameFromMenu}
        onDeleteFolder={handleDeleteFromMenu}
      />

      <AssetContextMenu
        menu={assetMenu}
        onClose={() => setAssetMenu(null)}
        onView={setInfoAsset}
        onRename={setRenameAsset}
        onEdit={setEditAsset}
        onDelete={requestTrashAsset}
      />

      <ConfirmModal
        dialog={confirmDialog}
        busy={confirmBusy}
        onClose={() => {
          if (!confirmBusy) {
            setConfirmDialog(null)
          }
        }}
      />

      <AssetPreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />

      <AssetInfoModal
        asset={infoAsset}
        folderName={
          infoAsset?.folder_id
            ? (nameById[infoAsset.folder_id] ?? `Folder ${infoAsset.folder_id}`)
            : 'Home'
        }
        onClose={() => setInfoAsset(null)}
      />

      <RenameAssetModal
        asset={renameAsset}
        submitting={renameSubmitting}
        onClose={() => setRenameAsset(null)}
        onSubmit={handleRenameAsset}
      />

      <RenameFolderModal
        folder={renameFolder}
        submitting={renameFolderSubmitting}
        onClose={() => setRenameFolder(null)}
        onSubmit={handleRenameFolder}
      />

      <CreateFolderModal
        open={folderModalOpen}
        parentLabel={createParentLabel}
        submitting={folderSubmitting}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <AddAssetModal
        open={addAssetOpen}
        submitting={assetSubmitting}
        folderOptions={addAssetFolderOptions}
        defaultFolderId={selectedId}
        accept={ASSET_FILE_ACCEPT}
        onClose={() => setAddAssetOpen(false)}
        onSubmit={handleAddAsset}
        onGenerateTags={handleSuggestTagsForNewAsset}
      />

      <EditAssetModal
        asset={editAsset}
        submitting={editSubmitting}
        folderOptions={addAssetFolderOptions}
        accept={ASSET_FILE_ACCEPT}
        onClose={() => setEditAsset(null)}
        onSubmit={handleEditAsset}
        onGenerateTags={handleSuggestTagsForEditAsset}
      />
    </div>
  )
}
