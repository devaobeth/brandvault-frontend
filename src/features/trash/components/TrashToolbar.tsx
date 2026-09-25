type TrashToolbarProps = {
  count: number
  selectedCount: number
  busy?: boolean
  onRestore: () => void
  onDeletePermanent: () => void
  onEmpty: () => void
}

export function TrashToolbar({
  count,
  selectedCount,
  busy = false,
  onRestore,
  onDeletePermanent,
  onEmpty,
}: TrashToolbarProps) {
  const hasSelection = selectedCount > 0

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!hasSelection || busy}
          onClick={onRestore}
          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Restore
        </button>
        <button
          type="button"
          disabled={!hasSelection || busy}
          onClick={onDeletePermanent}
          className="cursor-pointer rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete permanently
        </button>
        <button
          type="button"
          disabled={count === 0 || busy}
          onClick={onEmpty}
          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Empty Trash
        </button>
      </div>
      <p className="text-xs text-slate-500">
        {count} {count === 1 ? 'item' : 'items'}
        {hasSelection ? ` · ${selectedCount} selected` : ''}
      </p>
    </div>
  )
}
