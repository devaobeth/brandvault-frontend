import { useRef, useState, type DragEvent, type MouseEvent } from 'react'
import type { Asset } from '@/shared/types/api'
import { assetTypeIcon } from '@/features/assets/components/FileTypeIcons'
import { canPreviewAsset } from '@/features/assets/components/AssetPreviewModal'
import { ASSET_MIME } from '@/features/assets/lib/dnd'

type AssetCardProps = {
  asset: Asset
  selected?: boolean
  dragging?: boolean
  onOpen: (asset: Asset) => void
  onContextMenu: (event: MouseEvent, asset: Asset) => void
  onDragStart: (assetId: number) => void
  onDragEnd: () => void
}

export function AssetCard({
  asset,
  selected,
  dragging,
  onOpen,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: AssetCardProps) {
  const showPreview = asset.type === 'image' || asset.type === 'logo'
  const [imgFailed, setImgFailed] = useState(false)
  const openable = canPreviewAsset(asset)
  const draggedRef = useRef(false)

  function handleDragStart(event: DragEvent) {
    draggedRef.current = true
    event.dataTransfer.setData(ASSET_MIME, String(asset.id))
    event.dataTransfer.setData('text/plain', String(asset.id))
    event.dataTransfer.effectAllowed = 'move'
    onDragStart(asset.id)
  }

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => {
        onDragEnd()
        window.setTimeout(() => {
          draggedRef.current = false
        }, 0)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onContextMenu(event, asset)
      }}
      onClick={() => {
        if (draggedRef.current) {
          return
        }
        if (openable) {
          onOpen(asset)
        }
      }}
      className={[
        'flex w-[7.5rem] flex-col items-center rounded-md p-2',
        'cursor-grab active:cursor-grabbing',
        selected ? 'bg-sky-100' : 'hover:bg-sky-50',
        dragging ? 'opacity-40' : '',
      ].join(' ')}
      title="Drag onto a folder to move · click to open when supported"
    >
      <div className="flex w-full flex-col items-center gap-2 text-center">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
          {showPreview && !imgFailed ? (
            <img
              src={asset.url}
              alt={asset.name}
              className="h-full w-full object-cover"
              draggable={false}
              onError={() => setImgFailed(true)}
            />
          ) : (
            assetTypeIcon(asset.type, 'h-12 w-12')
          )}
        </div>
        <span className="line-clamp-2 w-full break-words text-xs font-medium text-slate-800">
          {asset.name}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">{asset.type}</span>
      </div>
    </article>
  )
}
