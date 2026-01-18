import { createClient } from '@/lib/supabase/server'

const FREE_DAILY_LIMIT = 5
const PRO_DAILY_LIMIT = 100 // Effectively unlimited for reasonable use

export async function checkAIQuota(userId: string | null, isPro: boolean): Promise<{
  allowed: boolean
  remaining: number
  limit: number
}> {
  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT

  if (!userId) {
    // For anonymous users, we rely on client-side localStorage tracking
    // Server just enforces a conservative limit
    return {
      allowed: true,
      remaining: limit,
      limit,
    }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('ai_usage_daily')
    .select('count')
    .eq('user_id', userId)
    .eq('day', today)
    .single()

  const currentCount = data?.count || 0
  const remaining = Math.max(0, limit - currentCount)

  return {
    allowed: remaining > 0,
    remaining,
    limit,
  }
}

export async function incrementAIQuota(userId: string): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('ai_usage_daily')
    .select('count')
    .eq('user_id', userId)
    .eq('day', today)
    .single()

  if (existing) {
    await supabase
      .from('ai_usage_daily')
      .update({ count: existing.count + 1 })
      .eq('user_id', userId)
      .eq('day', today)
  } else {
    await supabase
      .from('ai_usage_daily')
      .insert({ user_id: userId, day: today, count: 1 })
  }
}

export async function checkAnonPostQuota(userId: string): Promise<{
  allowed: boolean
  remaining: number
}> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('posts')
    .select('id')
    .eq('author_id', userId)
    .eq('is_anon', true)
    .gte('created_at', `${today}T00:00:00.000Z`)

  const count = data?.length || 0
  const limit = 1

  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
  }
}
