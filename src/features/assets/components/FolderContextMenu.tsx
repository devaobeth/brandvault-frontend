import { useEffect, useRef } from 'react'

export type FolderContextTarget =
  | { kind: 'home' }
  | { kind: 'folder'; folderId: number; folderName: string }
  | { kind: 'blank'; parentId: number | null }

export type FolderContextMenuState = {
  x: number
  y: number
  target: FolderContextTarget
}

type FolderContextMenuProps = {
  menu: FolderContextMenuState | null
  onClose: () => void
  onNewFolder: (parentId: number | null) => void
  onRenameFolder: (folderId: number, folderName: string) => void
  onDeleteFolder: (folderId: number, folderName: string) => void
}

export function FolderContextMenu({
  menu,
  onClose,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) {
      return
    }

    function handlePointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menu, onClose])

  if (!menu) {
    return null
  }

  const left = Math.min(menu.x, window.innerWidth - 180)
  const top = Math.min(menu.y, window.innerHeight - 140)

  if (menu.target.kind === 'folder') {
    const { folderId, folderName } = menu.target
    return (
      <div
        ref={ref}
        role="menu"
        className="fixed z-50 min-w-[10rem] rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
        style={{ left, top }}
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
          onClick={() => {
            onNewFolder(folderId)
            onClose()
          }}
        >
          New folder
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
          onClick={() => {
            onRenameFolder(folderId, folderName)
            onClose()
          }}
        >
          Rename
        </button>
        <div className="my-1 border-t border-slate-100" />
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
          onClick={() => {
            onDeleteFolder(folderId, folderName)
            onClose()
          }}
        >
          Delete
        </button>
      </div>
    )
  }

  const parentId =
    menu.target.kind === 'home' ? null : menu.target.parentId

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-[10rem] rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
      style={{ left, top }}
    >
      <button
        type="button"
        role="menuitem"
        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
        onClick={() => {
          onNewFolder(parentId)
          onClose()
        }}
      >
        New folder
      </button>
    </div>
  )
}
