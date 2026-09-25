import type { MouseEvent } from 'react'
import type { TrashEntry } from '@/features/trash/api'
import { TrashItem } from '@/features/trash/components/TrashItem'
import { EmptyState } from '@/shared/components/EmptyState'

type TrashGridProps = {
  entries: TrashEntry[]
  selectedKeys: Set<string>
  onSelect: (entry: TrashEntry, additive: boolean) => void
  onContextMenu: (event: MouseEvent, entry: TrashEntry) => void
  onActivate: (entry: TrashEntry) => void
}

export function TrashGrid({
  entries,
  selectedKeys,
  onSelect,
  onContextMenu,
  onActivate,
}: TrashGridProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Trash is empty"
        description="Folders and files you delete appear here, like Recycle Bin."
      />
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((entry) => (
        <TrashItem
          key={entry.key}
          entry={entry}
          selected={selectedKeys.has(entry.key)}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          onActivate={onActivate}
        />
      ))}
    </div>
  )
}
