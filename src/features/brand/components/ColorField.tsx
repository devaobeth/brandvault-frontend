import type { ChangeEvent } from 'react'
import { fieldClass } from '@/shared/lib/formField'

const HEX_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

type ColorFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}

function toColorInputValue(hex: string): string {
  if (/^#[A-Fa-f0-9]{6}$/.test(hex)) {
    return hex
  }
  if (/^#[A-Fa-f0-9]{3}$/.test(hex)) {
    const [, r, g, b] = hex
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#000000'
}

export function isValidHex(value: string): boolean {
  return HEX_PATTERN.test(value)
}

export function ColorField({ label, value, onChange, error }: ColorFieldProps) {
  function handleHexChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  function handlePickerChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value.toUpperCase())
  }

  const errorId = `${label.replace(/\s+/g, '-').toLowerCase()}-color-error`

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 shrink-0 rounded-md border border-slate-200 shadow-sm"
          style={{ backgroundColor: isValidHex(value) ? value : '#e2e8f0' }}
          title={value}
        />
        <input
          type="color"
          value={toColorInputValue(value)}
          onChange={handlePickerChange}
          className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={handleHexChange}
          placeholder="#1A73E8"
          className={`${fieldClass(Boolean(error))} font-mono uppercase`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
