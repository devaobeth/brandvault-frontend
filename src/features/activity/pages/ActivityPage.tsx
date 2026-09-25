import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { listActivity, type ActivityItem } from '@/features/activity/api'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { Spinner } from '@/shared/components/Spinner'

function apiMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { message?: string } | undefined
    return body?.message || fallback
  }
  return fallback
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listActivity())
    } catch (err) {
      setError(apiMessage(err, 'Could not load activity.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Activity</h1>
          <p className="mt-1 text-sm text-slate-500">
            Recent actions in this workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {!loading && error ? <ErrorState message={error} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Actions like creating assets, trashing files, or updating the brand kit will show up here."
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <p className="text-sm text-slate-900">{item.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatWhen(item.created_at)}
                {item.action ? (
                  <span className="ml-2 font-mono text-slate-400">{item.action}</span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
