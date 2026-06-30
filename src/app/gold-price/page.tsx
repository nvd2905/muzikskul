import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { getDomesticGoldPrices, getSJCHistory24h } from '@/modules/gold-price/services'
import GoldPriceDashboard from '@/modules/gold-price/components/GoldPriceDashboard'
import { getCurrentUser } from '@/modules/auth/actions'
import Navbar from '@/shared/components/Navbar'

export const metadata = { title: 'Giá vàng trong nước — Muzikskul' }

export default async function GoldPricePage() {
  async function signInFromGoldPage() {
    'use server'
    const supabase = await createClient()
    const headersList = await headers()
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const host = headersList.get('host') ?? 'localhost:3000'
    const origin = `${proto}://${host}`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${origin}/auth/callback?next=/gold-price` },
    })
    if (error) throw error
    redirect(data.url)
  }

  const [prices, history, user] = await Promise.all([
    getDomesticGoldPrices(),
    getSJCHistory24h(),
    getCurrentUser(),
  ])

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar user={user} />
      <GoldPriceDashboard
        prices={prices}
        history={history}
        user={user}
        onSignIn={signInFromGoldPage}
      />
    </main>
  )
}
