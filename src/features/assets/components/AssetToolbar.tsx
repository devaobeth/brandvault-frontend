import type { AssetType } from '@/shared/types/api'

export type AssetSort = 'updated_desc' | 'name_asc'
export type TypeFilter = 'all' | AssetType

type AssetToolbarProps = {
  query: string
  typeFilter: TypeFilter
  sort: AssetSort
  count: number
  adding?: boolean
  onQueryChange: (value: string) => void
  onTypeFilterChange: (value: TypeFilter) => void
  onSortChange: (value: AssetSort) => void
  onAddAsset: () => void
  onNewFolder: () => void
}

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'logo', label: 'Logo' },
  { value: 'document', label: 'Document' },
  { value: 'font', label: 'Font' },
]

export function AssetToolbar({
  query,
  typeFilter,
  sort,
  count,
  adding = false,
  onQueryChange,
  onTypeFilterChange,
  onSortChange,
  onAddAsset,
  onNewFolder,
}: AssetToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search assets…"
          className="w-full min-w-[10rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:max-w-xs"
        />
        <select
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as TypeFilter)}
          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as AssetSort)}
          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="updated_desc">Updated</option>
          <option value="name_asc">Name</option>
        </select>
        <span className="text-xs text-slate-500">{count} items</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onNewFolder}
          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          New folder
        </button>
        <button
          type="button"
          onClick={onAddAsset}
          disabled={adding}
          className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {adding ? 'Adding…' : 'Add asset'}
        </button>
      </div>
    </div>
  )
}
