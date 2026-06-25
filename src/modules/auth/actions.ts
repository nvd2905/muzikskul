'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'

export async function signInWithDiscord() {
  const supabase = await createClient()
  const headersList = await headers()

  const proto = headersList.get('x-forwarded-proto') ?? 'http'
  const host = headersList.get('host') ?? 'localhost:3000'
  const origin = `${proto}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) throw error

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  return {
    id: user.id,
    email: user.email ?? null,
    name: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? null) as string | null,
    avatarUrl: (user.user_metadata?.avatar_url ?? null) as string | null,
  }
}
