import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/supabase/server'
import {
  getPersonalTransactions,
  getWalletSummary,
  addPersonalTransaction,
  TRANSACTION_CATEGORIES,
  type TransactionCategory,
  type TransactionType,
} from '@/modules/wallet/services'
import WalletDashboard from '@/modules/wallet/components/WalletDashboard'
import Navbar from '@/shared/components/Navbar'

export default async function MyWalletPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [summary, transactions] = await Promise.all([
    getWalletSummary(user.id),
    getPersonalTransactions(user.id),
  ])

  async function handleAddTransaction(
    amount: number,
    type: TransactionType,
    category: TransactionCategory,
    description: string,
  ): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      if (!Number.isFinite(amount) || amount <= 0) {
        return { error: 'Số tiền không hợp lệ.' }
      }
      if (type !== 'income' && type !== 'expense') {
        return { error: 'Loại giao dịch không hợp lệ.' }
      }
      if (!TRANSACTION_CATEGORIES.includes(category)) {
        return { error: 'Danh mục không hợp lệ.' }
      }

      await addPersonalTransaction(user.id, amount, type, category, description.trim() || null)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar
        user={{
          id: user.id,
          email: user.email ?? null,
          name: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? null) as string | null,
          avatarUrl: (user.user_metadata?.avatar_url ?? null) as string | null,
        }}
      />
      <WalletDashboard summary={summary} transactions={transactions} onAddTransaction={handleAddTransaction} />
    </main>
  )
}
