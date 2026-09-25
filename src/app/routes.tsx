import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { ProtectedRoute } from '@/app/routes/ProtectedRoute'
import { AuthProvider } from '@/features/auth/context'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { AssetsPage } from '@/features/assets/pages/AssetsPage'
import { BrandPage } from '@/features/brand/pages/BrandPage'
import { TrashPage } from '@/features/trash/pages/TrashPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/assets" replace />} />
              <Route path="/brand" element={<BrandPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/trash" element={<TrashPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
