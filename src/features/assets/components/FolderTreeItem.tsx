import type { DragEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { Folder } from '@/shared/types/api'
import { FolderIcon, HomeIcon } from '@/features/assets/components/FileTypeIcons'
import type { FolderContextTarget } from '@/features/assets/components/FolderContextMenu'
import { FOLDER_MIME } from '@/features/assets/lib/dnd'

export { folderDragMime } from '@/features/assets/lib/dnd'

type FolderTreeItemProps = {
  folder: Folder
  depth: number
  selectedId: number | null
  expandedIds: Set<number>
  childrenByParent: Record<string, Folder[]>
  dropTargetKey: string | null
  draggingId: number | null
  onToggle: (folderId: number) => void
  onSelect: (folderId: number | null) => void
  onDragStart: (folderId: number) => void
  onDragEnd: () => void
  onDragOverTarget: (key: string | null) => void
  onDropOn: (targetParentId: number | null) => void
  onContextMenu: (event: ReactMouseEvent, target: FolderContextTarget) => void
}

export function FolderTreeItem({
  folder,
  depth,
  selectedId,
  expandedIds,
  childrenByParent,
  dropTargetKey,
  draggingId,
  onToggle,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOverTarget,
  onDropOn,
  onContextMenu,
}: FolderTreeItemProps) {
  const isExpanded = expandedIds.has(folder.id)
  const isSelected = selectedId === folder.id
  const childKey = String(folder.id)
  const children = childrenByParent[childKey]
  const hasChildren = children === undefined || children.length > 0
  const isDropTarget = dropTargetKey === childKey
  const isDragging = draggingId === folder.id

  function handleDragStart(event: DragEvent) {
    event.dataTransfer.setData(FOLDER_MIME, String(folder.id))
    event.dataTransfer.setData('text/plain', String(folder.id))
    event.dataTransfer.effectAllowed = 'move'
    onDragStart(folder.id)
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    onDragOverTarget(childKey)
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    onDragOverTarget(null)
    onDropOn(folder.id)
  }

  return (
    <li>
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isExpanded}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={() => onDragOverTarget(null)}
        onDrop={handleDrop}
        onContextMenu={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onSelect(folder.id)
          onContextMenu(event, {
            kind: 'folder',
            folderId: folder.id,
            folderName: folder.name,
          })
        }}
        className={[
          'group flex cursor-default items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm',
          isSelected ? 'bg-sky-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100',
          isDropTarget ? 'ring-2 ring-sky-400 ring-offset-1' : '',
          isDragging ? 'opacity-40' : '',
        ].join(' ')}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button
          type="button"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          disabled={!hasChildren}
          onClick={(event) => {
            event.stopPropagation()
            if (hasChildren) {
              onToggle(folder.id)
            }
          }}
          className={[
            'flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs',
            hasChildren ? 'cursor-pointer' : 'cursor-default opacity-30',
            'text-slate-500 hover:bg-slate-200/80',
          ].join(' ')}
        >
          {hasChildren ? (isExpanded ? '▾' : '▸') : '·'}
        </button>
        <FolderIcon className="h-4 w-4 shrink-0" />
        <button
          type="button"
          onClick={() => onSelect(folder.id)}
          className="min-w-0 flex-1 cursor-pointer truncate text-left"
        >
          {folder.name}
        </button>
      </div>

      {isExpanded && children ? (
        <ul role="group" className="mt-0.5 space-y-0.5">
          {children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              childrenByParent={childrenByParent}
              dropTargetKey={dropTargetKey}
              draggingId={draggingId}
              onToggle={onToggle}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOverTarget={onDragOverTarget}
              onDropOn={onDropOn}
              onContextMenu={onContextMenu}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

type HomeRowProps = {
  selected: boolean
  dropTargetKey: string | null
  onSelect: () => void
  onDragOverTarget: (key: string | null) => void
  onDropOnRoot: () => void
  onContextMenu?: (event: ReactMouseEvent) => void
  trailing?: ReactNode
}

export function HomeRow({
  selected,
  dropTargetKey,
  onSelect,
  onDragOverTarget,
  onDropOnRoot,
  onContextMenu,
  trailing,
}: HomeRowProps) {
  const isDropTarget = dropTargetKey === 'root'

  return (
    <div
      role="treeitem"
      aria-selected={selected}
      onContextMenu={onContextMenu}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        onDragOverTarget('root')
      }}
      onDragLeave={() => onDragOverTarget(null)}
      onDrop={(event) => {
        event.preventDefault()
        onDragOverTarget(null)
        onDropOnRoot()
      }}
      className={[
        'mb-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm',
        selected ? 'bg-sky-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100',
        isDropTarget ? 'ring-2 ring-sky-400 ring-offset-1' : '',
      ].join(' ')}
    >
      <HomeIcon
        className={['h-4 w-4 shrink-0', selected ? 'text-sky-700' : 'text-slate-500'].join(' ')}
      />
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 cursor-pointer truncate text-left font-medium"
      >
        Home
      </button>
      {trailing}
    </div>
  )
}

/** @deprecated use HomeRow */
export const LibraryRootRow = HomeRow
