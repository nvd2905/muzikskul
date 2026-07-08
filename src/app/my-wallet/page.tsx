import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/supabase/server'
import {
  getPersonalTransactions,
  getWalletSummary,
  getCategoryBreakdown,
  getUserCategories,
  addUserCategory,
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

  const [summary, transactions, categoryBreakdown, customCategories] = await Promise.all([
    getWalletSummary(user.id),
    getPersonalTransactions(user.id),
    getCategoryBreakdown(user.id),
    getUserCategories(user.id),
  ])
  const categories = [...TRANSACTION_CATEGORIES, ...customCategories]

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

      const customCategories = await getUserCategories(user.id)
      if (![...TRANSACTION_CATEGORIES, ...customCategories].includes(category)) {
        return { error: 'Danh mục không hợp lệ.' }
      }

      await addPersonalTransaction(user.id, amount, type, category, description.trim() || null)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleAddCategory(name: string): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const trimmed = name.trim()
      if (!trimmed) {
        return { error: 'Vui lòng nhập tên danh mục.' }
      }
      if (trimmed.length > 30) {
        return { error: 'Tên danh mục tối đa 30 ký tự.' }
      }

      const customCategories = await getUserCategories(user.id)
      const allCategories = [...TRANSACTION_CATEGORIES, ...customCategories]
      if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        return { error: 'Danh mục này đã tồn tại.' }
      }

      await addUserCategory(user.id, trimmed, allCategories)
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
      <WalletDashboard
        summary={summary}
        transactions={transactions}
        categoryBreakdown={categoryBreakdown}
        categories={categories}
        onAddTransaction={handleAddTransaction}
        onAddCategory={handleAddCategory}
      />
    </main>
  )
}
