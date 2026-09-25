type BrandPreviewProps = {
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string
  defaultFont: string
}

export function BrandPreview({
  name,
  primaryColor,
  secondaryColor,
  logoUrl,
  defaultFont,
}: BrandPreviewProps) {
  const displayName = name.trim() || 'Your brand'
  const font = defaultFont.trim() || 'system-ui'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Preview</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {logoUrl.trim() ? (
            <img src={logoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-slate-400">Logo</span>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: font }}>
            {displayName}
          </h2>
          {defaultFont.trim() ? (
            <p className="mt-1 text-sm text-slate-500" style={{ fontFamily: font }}>
              Font: {defaultFont}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex overflow-hidden rounded-lg border border-slate-200">
        <div className="h-20 flex-1" style={{ backgroundColor: primaryColor || '#e2e8f0' }} />
        <div className="h-20 flex-1" style={{ backgroundColor: secondaryColor || '#e2e8f0' }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Primary</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-block h-5 w-5 rounded border border-slate-200"
              style={{ backgroundColor: primaryColor || '#e2e8f0' }}
            />
            <code className="text-slate-800">{primaryColor || '—'}</code>
          </div>
        </div>
        <div>
          <p className="text-slate-500">Secondary</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-block h-5 w-5 rounded border border-slate-200"
              style={{ backgroundColor: secondaryColor || '#e2e8f0' }}
            />
            <code className="text-slate-800">{secondaryColor || '—'}</code>
          </div>
        </div>
      </div>
    </div>
  )
}
