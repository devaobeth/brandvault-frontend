import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context'
import { ConfirmModal, type ConfirmDialogState } from '@/shared/components/ConfirmModal'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'cursor-pointer rounded-md px-3 py-2 text-sm font-medium',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
  ].join(' ')

export function AppLayout() {
  const { user, workspace, logout } = useAuth()
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  const [logoutBusy, setLogoutBusy] = useState(false)

  function requestLogout() {
    setConfirmDialog({
      title: 'Log out?',
      message: 'Are you sure you want to log out of BrandVault?',
      confirmLabel: 'Log out',
      tone: 'default',
      onConfirm: async () => {
        setLogoutBusy(true)
        try {
          await logout()
        } finally {
          setLogoutBusy(false)
          setConfirmDialog(null)
        }
      },
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">BrandVault</p>
            <p className="text-xs text-slate-500">
              {workspace?.name ?? 'Workspace'} · {user?.email}
            </p>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/brand" className={linkClass}>
              Brand
            </NavLink>
            <NavLink to="/assets" className={linkClass}>
              Assets
            </NavLink>
            <NavLink to="/trash" className={linkClass}>
              Trash
            </NavLink>
            <NavLink to="/activity" className={linkClass}>
              Activity
            </NavLink>
            <button
              type="button"
              onClick={requestLogout}
              className="ml-2 cursor-pointer rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <ConfirmModal
        dialog={confirmDialog}
        busy={logoutBusy}
        onClose={() => {
          if (!logoutBusy) {
            setConfirmDialog(null)
          }
        }}
      />
    </div>
  )
}
