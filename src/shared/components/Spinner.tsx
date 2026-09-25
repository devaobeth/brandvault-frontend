export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
