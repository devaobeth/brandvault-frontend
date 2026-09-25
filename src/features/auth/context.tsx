import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '@/features/auth/api'
import { clearToken, getToken, setToken } from '@/shared/lib/storage'
import type { User, Workspace } from '@/shared/types/api'

type AuthContextValue = {
  user: User | null
  workspace: Workspace | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>
  logout: () => Promise<void>
  continueAsDemo: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [isLoading, setIsLoading] = useState(true)

  const applyAuth = useCallback((nextToken: string, nextUser: User, nextWorkspace: Workspace) => {
    setToken(nextToken)
    setTokenState(nextToken)
    setUser(nextUser)
    setWorkspace(nextWorkspace)
  }, [])

  const clearAuth = useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
    setWorkspace(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!getToken()) {
        if (!cancelled) setIsLoading(false)
        return
      }

      try {
        const me = await authApi.fetchMe()
        if (!cancelled) {
          setUser(me.user)
          setWorkspace(me.workspace)
        }
      } catch {
        if (!cancelled) clearAuth()
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [clearAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      workspace,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      async login(email, password) {
        const data = await authApi.login(email, password)
        applyAuth(data.token, data.user, data.workspace)
      },
      async register(name, email, password, passwordConfirmation) {
        const data = await authApi.register(name, email, password, passwordConfirmation)
        applyAuth(data.token, data.user, data.workspace)
      },
      async logout() {
        try {
          await authApi.logout()
        } finally {
          clearAuth()
        }
      },
      async continueAsDemo() {
        const data = await authApi.login('demo@brandvault.dev', 'Demo1234!')
        applyAuth(data.token, data.user, data.workspace)
      },
    }),
    [applyAuth, clearAuth, isLoading, token, user, workspace],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
