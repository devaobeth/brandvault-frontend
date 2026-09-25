import type { DragEvent, MouseEvent } from 'react'
import type { Folder } from '@/shared/types/api'
import { LargeFolderIcon } from '@/features/assets/components/FileTypeIcons'
import { folderDragMime } from '@/features/assets/lib/dnd'

type SubfolderListProps = {
  folders: Folder[]
  dropTargetKey: string | null
  draggingId: number | null
  onSelect: (folderId: number) => void
  onDragStart: (folderId: number) => void
  onDragEnd: () => void
  onDragOverTarget: (key: string | null) => void
  onDropOn: (targetParentId: number) => void
  onContextMenu: (event: MouseEvent, folder: Folder) => void
}

export function SubfolderList({
  folders,
  dropTargetKey,
  draggingId,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOverTarget,
  onDropOn,
  onContextMenu,
}: SubfolderListProps) {
  if (folders.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1">
      {folders.map((folder) => {
        const key = String(folder.id)
        const isDropTarget = dropTargetKey === `sub-${key}`
        const isDragging = draggingId === folder.id

        function handleDragStart(event: DragEvent) {
          event.dataTransfer.setData(folderDragMime(), String(folder.id))
          event.dataTransfer.setData('text/plain', String(folder.id))
          event.dataTransfer.effectAllowed = 'move'
          onDragStart(folder.id)
        }

        return (
          <div
            key={folder.id}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              onDragOverTarget(`sub-${key}`)
            }}
            onDragLeave={() => onDragOverTarget(null)}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onDragOverTarget(null)
              onDropOn(folder.id)
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onContextMenu(event, folder)
            }}
            className={[
              'flex w-[7.5rem] cursor-grab flex-col items-center rounded-md p-2 active:cursor-grabbing',
              isDropTarget ? 'bg-sky-100 ring-2 ring-sky-400' : 'hover:bg-sky-50',
              isDragging ? 'opacity-40' : '',
            ].join(' ')}
          >
            <button
              type="button"
              onDoubleClick={() => onSelect(folder.id)}
              onClick={() => onSelect(folder.id)}
              className="flex w-full cursor-pointer flex-col items-center gap-2 text-center"
              title={`${folder.name} — right-click to rename or delete`}
            >
              <LargeFolderIcon className="h-14 w-14" />
              <span className="line-clamp-2 w-full break-words text-xs font-medium text-slate-800">
                {folder.name}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
