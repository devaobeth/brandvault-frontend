import { api } from '@/shared/api/client'

export type ActivityItem = {
  id: number
  action: string
  message: string
  subject_type: string | null
  subject_id: number | null
  user_email: string | null
  created_at: string
}

export async function listActivity(): Promise<ActivityItem[]> {
  const { data } = await api.get<{ activities: ActivityItem[] }>('/api/activity')
  return data.activities
}
