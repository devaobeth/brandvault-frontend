import { useEffect, useRef } from 'react'
import type { Asset } from '@/shared/types/api'

export type AssetContextMenuState = {
  x: number
  y: number
  asset: Asset
}

type AssetContextMenuProps = {
  menu: AssetContextMenuState | null
  onClose: () => void
  onView: (asset: Asset) => void
  onRename: (asset: Asset) => void
  onEdit: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

export function AssetContextMenu({
  menu,
  onClose,
  onView,
  onRename,
  onEdit,
  onDelete,
}: AssetContextMenuProps) {
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
  const top = Math.min(menu.y, window.innerHeight - 180)

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-[10.5rem] rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
      style={{ left, top }}
    >
      <button
        type="button"
        role="menuitem"
        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
        onClick={() => {
          onView(menu.asset)
          onClose()
        }}
      >
        View
      </button>
      <button
        type="button"
        role="menuitem"
        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
        onClick={() => {
          onRename(menu.asset)
          onClose()
        }}
      >
        Rename
      </button>
      <button
        type="button"
        role="menuitem"
        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
        onClick={() => {
          onEdit(menu.asset)
          onClose()
        }}
      >
        Edit
      </button>
      <div className="my-1 border-t border-slate-100" />
      <button
        type="button"
        role="menuitem"
        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
        onClick={() => {
          onDelete(menu.asset)
          onClose()
        }}
      >
        Delete
      </button>
    </div>
  )
}
