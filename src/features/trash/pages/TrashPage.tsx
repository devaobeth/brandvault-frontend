import axios from 'axios'
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { AssetInfoModal } from '@/features/assets/components/AssetInfoModal'
import {
  emptyTrash,
  forceDeleteAsset,
  forceDeleteFolder,
  listTrash,
  restoreAsset,
  restoreFolder,
  type TrashEntry,
} from '@/features/trash/api'
import {
  TrashContextMenu,
  type TrashContextMenuState,
} from '@/features/trash/components/TrashContextMenu'
import { TrashGrid } from '@/features/trash/components/TrashGrid'
import { TrashToolbar } from '@/features/trash/components/TrashToolbar'
import { ConfirmModal, type ConfirmDialogState } from '@/shared/components/ConfirmModal'
import { ErrorState } from '@/shared/components/ErrorState'
import { Spinner } from '@/shared/components/Spinner'
import { SuccessAlert } from '@/shared/components/SuccessAlert'
import type { Asset } from '@/shared/types/api'

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

export function TrashPage() {
  const [entries, setEntries] = useState<TrashEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [menu, setMenu] = useState<TrashContextMenuState | null>(null)
  const [infoAsset, setInfoAsset] = useState<Asset | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [query, setQuery] = useState('')

  const loadTrash = useCallback(async (q?: string) => {
    setLoading(true)
    setError(null)
    try {
      const list = await listTrash({
        q: q || undefined,
        sort: 'updated_desc',
      })
      setEntries(list)
      setSelectedKeys((current) => {
        const next = new Set<string>()
        for (const key of current) {
          if (list.some((entry) => entry.key === key)) {
            next.add(key)
          }
        }
        return next
      })
    } catch (err) {
      setError(apiMessage(err, 'Could not load Trash.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTrash()
  }, [loadTrash])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTrash(query.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [loadTrash, query])

  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedKeys.has(entry.key)),
    [entries, selectedKeys],
  )

  function handleSelect(entry: TrashEntry, additive: boolean) {
    setSelectedKeys((current) => {
      if (additive) {
        const next = new Set(current)
        if (next.has(entry.key)) {
          next.delete(entry.key)
        } else {
          next.add(entry.key)
        }
        return next
      }
      return new Set([entry.key])
    })
  }

  function handleContextMenu(event: MouseEvent, entry: TrashEntry) {
    setSelectedKeys((current) => {
      if (current.has(entry.key)) {
        return current
      }
      return new Set([entry.key])
    })
    setMenu({
      x: event.clientX,
      y: event.clientY,
      entry,
    })
  }

  async function restoreMany(targets: TrashEntry[]) {
    if (targets.length === 0) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      for (const entry of targets) {
        if (entry.kind === 'folder') {
          await restoreFolder(entry.id)
        } else {
          await restoreAsset(entry.id)
        }
      }
      await loadTrash(query.trim())
      setSelectedKeys(new Set())
      setSuccess(
        targets.length === 1
          ? `Restored “${targets[0].name}”.`
          : `Restored ${targets.length} items.`,
      )
    } catch (err) {
      setError(apiMessage(err, 'Could not restore.'))
    } finally {
      setBusy(false)
    }
  }

  async function deleteMany(targets: TrashEntry[]) {
    if (targets.length === 0) {
      return
    }
    setConfirmBusy(true)
    try {
      for (const entry of targets) {
        if (entry.kind === 'folder') {
          await forceDeleteFolder(entry.id)
        } else {
          await forceDeleteAsset(entry.id)
        }
      }
      await loadTrash(query.trim())
      setSelectedKeys(new Set())
      setConfirmDialog(null)
      setSuccess(
        targets.length === 1
          ? `Permanently deleted “${targets[0].name}”.`
          : `Permanently deleted ${targets.length} items.`,
      )
    } catch (err) {
      setError(apiMessage(err, 'Could not delete permanently.'))
      setConfirmDialog(null)
    } finally {
      setConfirmBusy(false)
    }
  }

  async function performEmptyTrash() {
    setConfirmBusy(true)
    try {
      const result = await emptyTrash()
      await loadTrash(query.trim())
      setSelectedKeys(new Set())
      setConfirmDialog(null)
      setSuccess(
        result.deleted === 0
          ? 'Trash was already empty.'
          : `Emptied Trash (${result.deleted} items).`,
      )
    } catch (err) {
      setError(apiMessage(err, 'Could not empty Trash.'))
      setConfirmDialog(null)
    } finally {
      setConfirmBusy(false)
    }
  }

  function requestDeletePermanent(targets: TrashEntry[]) {
    if (targets.length === 0) {
      return
    }
    setConfirmDialog({
      title: 'Delete permanently?',
      message:
        targets.length === 1
          ? `Permanently delete “${targets[0].name}”? This cannot be undone.`
          : `Permanently delete ${targets.length} items? This cannot be undone.`,
      confirmLabel: 'Delete permanently',
      tone: 'danger',
      onConfirm: () => deleteMany(targets),
    })
  }

  function requestEmptyTrash() {
    setConfirmDialog({
      title: 'Empty Trash?',
      message: `Permanently delete all ${entries.length} items in Trash? This cannot be undone.`,
      confirmLabel: 'Empty Trash',
      tone: 'danger',
      onConfirm: () => performEmptyTrash(),
    })
  }

  return (
    <div className="space-y-4">
      {success ? (
        <SuccessAlert message={success} onClose={() => setSuccess(null)} />
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Trash</h1>
        <p className="text-sm text-slate-500">
          Restore folders and files or delete them permanently. Right-click for
          more options.
        </p>
      </div>

      {error ? <ErrorState message={error} /> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Trash…"
            className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <TrashToolbar
            count={entries.length}
            selectedCount={selectedKeys.size}
            busy={busy || confirmBusy}
            onRestore={() => void restoreMany(selectedEntries)}
            onDeletePermanent={() => requestDeletePermanent(selectedEntries)}
            onEmpty={requestEmptyTrash}
          />
        </div>

        <div className="min-h-[16rem] bg-slate-50/60 p-4">
          {loading ? (
            <Spinner />
          ) : (
            <TrashGrid
              entries={entries}
              selectedKeys={selectedKeys}
              onSelect={handleSelect}
              onContextMenu={handleContextMenu}
              onActivate={(entry) => void restoreMany([entry])}
            />
          )}
        </div>
      </div>

      <TrashContextMenu
        menu={menu}
        onClose={() => setMenu(null)}
        onRestore={(entry) => void restoreMany([entry])}
        onDeletePermanent={(entry) => requestDeletePermanent([entry])}
        onInfo={(entry) => {
          if (entry.kind === 'asset') {
            setInfoAsset(entry.asset)
          }
        }}
      />

      <AssetInfoModal
        asset={infoAsset}
        folderName={
          infoAsset?.folder_id != null
            ? `Folder #${infoAsset.folder_id}`
            : 'Home'
        }
        onClose={() => setInfoAsset(null)}
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
    </div>
  )
}
