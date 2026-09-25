import type { MouseEvent } from 'react'
import type { Asset } from '@/shared/types/api'
import { AssetCard } from '@/features/assets/components/AssetCard'
import { EmptyState } from '@/shared/components/EmptyState'

type AssetGridProps = {
  assets: Asset[]
  draggingAssetId: number | null
  onOpen: (asset: Asset) => void
  onContextMenu: (event: MouseEvent, asset: Asset) => void
  onDragStart: (assetId: number) => void
  onDragEnd: () => void
  empty?: boolean
}

export function AssetGrid({
  assets,
  draggingAssetId,
  onOpen,
  onContextMenu,
  onDragStart,
  onDragEnd,
  empty,
}: AssetGridProps) {
  if (assets.length === 0) {
    if (empty) {
      return (
        <EmptyState
          title="This folder is empty"
          description="Add an asset or create a subfolder."
        />
      )
    }
    return null
  }

  return (
    <div className="flex flex-wrap gap-1">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          dragging={draggingAssetId === asset.id}
          onOpen={onOpen}
          onContextMenu={onContextMenu}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  )
}
