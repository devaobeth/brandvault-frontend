import { api } from '@/shared/api/client'
import type { AuthResponse, User, Workspace } from '@/shared/types/api'

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/api/login', { email, password })
  return data
}

export async function register(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string,
) {
  const { data } = await api.post<AuthResponse>('/api/register', {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  })
  return data
}

export async function logout() {
  await api.post('/api/logout')
}

export async function fetchMe() {
  const { data } = await api.get<{ user: User; workspace: Workspace | null }>('/api/me')
  return data
}
