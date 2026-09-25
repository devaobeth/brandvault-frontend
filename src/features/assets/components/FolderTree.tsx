import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Folder } from '@/shared/types/api'
import { FolderTreeItem, HomeRow } from '@/features/assets/components/FolderTreeItem'
import type { FolderContextTarget } from '@/features/assets/components/FolderContextMenu'

type FolderTreeProps = {
  rootFolders: Folder[]
  childrenByParent: Record<string, Folder[]>
  selectedId: number | null
  expandedIds: Set<number>
  dropTargetKey: string | null
  draggingId: number | null
  onSelect: (folderId: number | null) => void
  onToggle: (folderId: number) => void
  onCreateClick: () => void
  onDragStart: (folderId: number) => void
  onDragEnd: () => void
  onDragOverTarget: (key: string | null) => void
  onDropOn: (targetParentId: number | null) => void
  onContextMenu: (event: ReactMouseEvent, target: FolderContextTarget) => void
}

export function FolderTree({
  rootFolders,
  childrenByParent,
  selectedId,
  expandedIds,
  dropTargetKey,
  draggingId,
  onSelect,
  onToggle,
  onCreateClick,
  onDragStart,
  onDragEnd,
  onDragOverTarget,
  onDropOn,
  onContextMenu,
}: FolderTreeProps) {
  return (
    <aside className="flex max-h-[20rem] w-full shrink-0 flex-col border-b border-slate-200 bg-white sm:max-h-none sm:min-h-[24rem] sm:w-64 sm:border-b-0 sm:border-r md:w-72">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Folders</h2>
        <button
          type="button"
          onClick={onCreateClick}
          className="cursor-pointer rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
          title="New folder"
        >
          New folder
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2"
        role="tree"
        onContextMenu={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault()
            onContextMenu(event, { kind: 'blank', parentId: null })
          }
        }}
      >
        <HomeRow
          selected={selectedId === null}
          dropTargetKey={dropTargetKey}
          onSelect={() => onSelect(null)}
          onDragOverTarget={onDragOverTarget}
          onDropOnRoot={() => onDropOn(null)}
          onContextMenu={(event) => {
            event.preventDefault()
            onContextMenu(event, { kind: 'home' })
          }}
        />

        <ul className="space-y-0.5">
          {rootFolders.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              depth={0}
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

        {rootFolders.length === 0 ? (
          <p className="mt-4 px-2 text-xs text-slate-400">
            No folders yet. Use New folder to create one.
          </p>
        ) : null}
      </div>
    </aside>
  )
}
