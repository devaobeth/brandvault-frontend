import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context'
import { Spinner } from '@/shared/components/Spinner'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Spinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
