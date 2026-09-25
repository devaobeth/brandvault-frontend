import { useEffect } from 'react'

type SuccessAlertProps = {
  message: string
  onClose: () => void
  durationMs?: number
}

export function SuccessAlert({ message, onClose, durationMs = 3000 }: SuccessAlertProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose()
    }, durationMs)

    return () => {
      window.clearTimeout(timer)
    }
    // Restart timer only when the message changes
  }, [durationMs, message]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-end px-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:px-0"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg animate-[toast-in_0.2s_ease-out]">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
          ✓
        </span>
        <p className="flex-1 pt-0.5">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 cursor-pointer rounded p-0.5 text-white/80 hover:bg-white/15 hover:text-white"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
