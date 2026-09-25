/** Shared form field styles matching LoginPage validation UX. */

export function fieldClass(hasError: boolean, extra = ''): string {
  return [
    'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition',
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : 'border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-100',
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}

export function fileFieldClass(hasError: boolean): string {
  return [
    'w-full cursor-pointer rounded-md border px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1',
    hasError ? 'border-red-400' : 'border-slate-300',
  ].join(' ')
}
