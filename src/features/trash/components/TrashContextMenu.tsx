import { useEffect, useRef } from 'react'
import type { TrashEntry } from '@/features/trash/api'

export type TrashContextMenuState = {
  x: number
  y: number
  entry: TrashEntry
}

type TrashContextMenuProps = {
  menu: TrashContextMenuState | null
  onClose: () => void
  onRestore: (entry: TrashEntry) => void
  onDeletePermanent: (entry: TrashEntry) => void
  onInfo: (entry: TrashEntry) => void
}

export function TrashContextMenu({
  menu,
  onClose,
  onRestore,
  onDeletePermanent,
  onInfo,
}: TrashContextMenuProps) {
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

  const left = Math.min(menu.x, window.innerWidth - 200)
  const top = Math.min(menu.y, window.innerHeight - 160)

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-[11rem] rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
      style={{ left, top }}
    >
      <button
        type="button"
        role="menuitem"
        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
        onClick={() => {
          onRestore(menu.entry)
          onClose()
        }}
      >
        Restore
      </button>
      {menu.entry.kind === 'asset' ? (
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
          onClick={() => {
            onInfo(menu.entry)
            onClose()
          }}
        >
          File information
        </button>
      ) : null}
      <div className="my-1 border-t border-slate-100" />
      <button
        type="button"
        role="menuitem"
        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
        onClick={() => {
          onDeletePermanent(menu.entry)
          onClose()
        }}
      >
        Delete permanently
      </button>
    </div>
  )
}
