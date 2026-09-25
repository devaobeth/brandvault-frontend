import { useEffect } from 'react'

export type ConfirmDialogState = {
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'default'
  onConfirm: () => void | Promise<void>
}

type ConfirmModalProps = {
  dialog: ConfirmDialogState | null
  busy?: boolean
  onClose: () => void
}

export function ConfirmModal({ dialog, busy = false, onClose }: ConfirmModalProps) {
  useEffect(() => {
    if (!dialog) {
      return
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        onClose()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, dialog, onClose])

  if (!dialog) {
    return null
  }

  const confirmLabel = dialog.confirmLabel ?? 'Delete'
  const danger = dialog.tone !== 'default'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={() => {
        if (!busy) {
          onClose()
        }
      }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">
          {dialog.title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-slate-600">
          {dialog.message}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void dialog.onConfirm()}
            className={[
              'cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60',
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-900 hover:bg-slate-800',
            ].join(' ')}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
