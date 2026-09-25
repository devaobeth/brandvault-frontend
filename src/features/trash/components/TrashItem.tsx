import { useState, type MouseEvent } from 'react'
import { LargeFolderIcon, assetTypeIcon } from '@/features/assets/components/FileTypeIcons'
import type { TrashEntry } from '@/features/trash/api'

type TrashItemProps = {
  entry: TrashEntry
  selected: boolean
  onSelect: (entry: TrashEntry, additive: boolean) => void
  onContextMenu: (event: MouseEvent, entry: TrashEntry) => void
  onActivate: (entry: TrashEntry) => void
}

function formatDeletedAt(value: string | null) {
  if (!value) {
    return '—'
  }
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

export function TrashItem({
  entry,
  selected,
  onSelect,
  onContextMenu,
  onActivate,
}: TrashItemProps) {
  const showPreview =
    entry.kind === 'asset' &&
    (entry.asset.type === 'image' || entry.asset.type === 'logo')
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <article
      onClick={(event) => onSelect(entry, event.metaKey || event.ctrlKey)}
      onDoubleClick={() => onActivate(entry)}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onContextMenu(event, entry)
      }}
      className={[
        'flex w-[8.5rem] cursor-pointer flex-col items-center rounded-md p-2',
        selected ? 'bg-sky-100 ring-1 ring-sky-300' : 'hover:bg-sky-50',
      ].join(' ')}
      title={`${entry.name} — deleted ${formatDeletedAt(entry.deleted_at)}`}
    >
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
        {entry.kind === 'folder' ? (
          <LargeFolderIcon className="h-14 w-14 opacity-80" />
        ) : showPreview && !imgFailed ? (
          <img
            src={entry.asset.url}
            alt={entry.name}
            className="h-full w-full object-cover opacity-80"
            draggable={false}
            onError={() => setImgFailed(true)}
          />
        ) : (
          assetTypeIcon(entry.asset.type, 'h-12 w-12')
        )}
      </div>
      <span className="mt-2 line-clamp-2 w-full break-words text-center text-xs font-medium text-slate-800">
        {entry.name}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
        {entry.kind === 'folder' ? 'Folder' : entry.asset.type}
      </span>
      <span className="mt-0.5 line-clamp-1 w-full text-center text-[10px] text-slate-400">
        {formatDeletedAt(entry.deleted_at)}
      </span>
    </article>
  )
}
