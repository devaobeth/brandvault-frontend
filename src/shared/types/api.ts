export type User = {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
}

export type Workspace = {
  id: number
  user_id: number
  name: string
  created_at: string
  updated_at: string
}

export type Brand = {
  id: number
  workspace_id: number
  name: string
  primary_color: string
  secondary_color: string
  logo_url: string | null
  default_font: string | null
  created_at: string
  updated_at: string
}

export type Folder = {
  id: number
  workspace_id: number
  parent_id: number | null
  name: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type AssetType = 'image' | 'video' | 'logo' | 'document' | 'font'

export type Asset = {
  id: number
  workspace_id: number
  folder_id: number | null
  name: string
  type: AssetType
  url: string
  tags: string[] | null
  description: string | null
  usage_suggestion: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type AuthResponse = {
  token: string
  user: User
  workspace: Workspace
}

export type ApiErrorBody = {
  message?: string
  errors?: Record<string, string[]>
}
