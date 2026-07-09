import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/supabase/server'
import { getCurrentUser } from '@/modules/auth/actions'
import {
  ensureDefaultAccount,
  getAccessibleWallets,
  getPersonalTransactions,
  getWalletSummary,
  getCategoryBreakdown,
  getUserCategories,
  getWalletMembers,
  getWalletAccess,
  addUserCategory,
  addPersonalTransaction,
  updatePersonalTransaction,
  deletePersonalTransaction,
  renameAccount,
  inviteUserToWallet,
  revokeWalletShare,
  getPaymentAccounts,
  createPaymentAccount,
  getBudgetLimits,
  setBudgetLimit,
  getMonthlyAnalytics,
  TRANSACTION_CATEGORIES,
  type PaymentAccountType,
  type SharePermission,
  type TransactionCategory,
  type TransactionType,
} from '@/modules/wallet/services'
import WalletDashboard from '@/modules/wallet/components/WalletDashboard'
import Navbar from '@/shared/components/Navbar'

export default async function MyWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ wallet?: string }>
}) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const defaultAccount = await ensureDefaultAccount()
  const accessibleWallets = await getAccessibleWallets(user.id)

  const { wallet: requestedAccountId } = await searchParams
  const selectedWallet =
    accessibleWallets.find(w => w.account.id === requestedAccountId) ??
    accessibleWallets.find(w => w.account.id === defaultAccount.id) ??
    accessibleWallets[0]
  const selectedAccount = selectedWallet.account
  const permission = selectedWallet.permission

  const [summary, transactions, categoryBreakdown, customCategories, members, paymentAccounts, budgetLimits, analytics] =
    await Promise.all([
      getWalletSummary(selectedAccount.id),
      getPersonalTransactions(selectedAccount.id),
      getCategoryBreakdown(selectedAccount.id),
      getUserCategories(selectedAccount.id),
      getWalletMembers(selectedAccount.id),
      getPaymentAccounts(selectedAccount.id),
      getBudgetLimits(selectedAccount.id),
      getMonthlyAnalytics(selectedAccount.id),
    ])
  const categories = [...TRANSACTION_CATEGORIES, ...customCategories]

  async function handleAddTransaction(
    accountId: string,
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

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.permission !== 'edit') return { error: 'Bạn không có quyền chỉnh sửa ví này.' }

      if (!Number.isFinite(amount) || amount <= 0) {
        return { error: 'Số tiền không hợp lệ.' }
      }
      if (type !== 'income' && type !== 'expense') {
        return { error: 'Loại giao dịch không hợp lệ.' }
      }

      const customCategories = await getUserCategories(accountId)
      if (![...TRANSACTION_CATEGORIES, ...customCategories].includes(category)) {
        return { error: 'Danh mục không hợp lệ.' }
      }

      await addPersonalTransaction(accountId, user.id, amount, type, category, description.trim() || null)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleAddCategory(accountId: string, name: string): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.permission !== 'edit') return { error: 'Bạn không có quyền chỉnh sửa ví này.' }

      const trimmed = name.trim()
      if (!trimmed) {
        return { error: 'Vui lòng nhập tên danh mục.' }
      }
      if (trimmed.length > 30) {
        return { error: 'Tên danh mục tối đa 30 ký tự.' }
      }

      const customCategories = await getUserCategories(accountId)
      const allCategories = [...TRANSACTION_CATEGORIES, ...customCategories]
      if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        return { error: 'Danh mục này đã tồn tại.' }
      }

      await addUserCategory(accountId, user.id, trimmed, allCategories)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleUpdateTransaction(
    accountId: string,
    transactionId: string,
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

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.permission !== 'edit') return { error: 'Bạn không có quyền chỉnh sửa ví này.' }

      if (!Number.isFinite(amount) || amount <= 0) {
        return { error: 'Số tiền không hợp lệ.' }
      }
      if (type !== 'income' && type !== 'expense') {
        return { error: 'Loại giao dịch không hợp lệ.' }
      }

      const customCategories = await getUserCategories(accountId)
      if (![...TRANSACTION_CATEGORIES, ...customCategories].includes(category)) {
        return { error: 'Danh mục không hợp lệ.' }
      }

      await updatePersonalTransaction(transactionId, amount, type, category, description.trim() || null)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleDeleteTransaction(accountId: string, transactionId: string): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.permission !== 'edit') return { error: 'Bạn không có quyền chỉnh sửa ví này.' }

      await deletePersonalTransaction(transactionId)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleRenameWallet(accountId: string, name: string): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.role !== 'owner') return { error: 'Chỉ chủ sở hữu mới có thể đổi tên ví.' }

      const trimmed = name.trim()
      if (!trimmed) return { error: 'Vui lòng nhập tên ví.' }
      if (trimmed.length > 50) return { error: 'Tên ví tối đa 50 ký tự.' }

      await renameAccount(accountId, trimmed)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleShareWallet(
    accountId: string,
    email: string,
    permission: SharePermission,
  ): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.role !== 'owner') return { error: 'Chỉ chủ sở hữu mới có thể mời thành viên.' }

      const result = await inviteUserToWallet(accountId, email, permission)
      if (result.error) return result

      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleRevokeShare(accountId: string, sharedWithUserId: string): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.role !== 'owner') return { error: 'Chỉ chủ sở hữu mới có thể thu hồi quyền truy cập.' }

      await revokeWalletShare(accountId, sharedWithUserId)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleCreatePaymentAccount(
    accountId: string,
    name: string,
    type: PaymentAccountType,
  ): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.permission !== 'edit') return { error: 'Bạn không có quyền chỉnh sửa ví này.' }

      const trimmed = name.trim()
      if (!trimmed) return { error: 'Vui lòng nhập tên tài khoản.' }
      if (trimmed.length > 30) return { error: 'Tên tài khoản tối đa 30 ký tự.' }
      if (type !== 'cash' && type !== 'bank' && type !== 'other') return { error: 'Loại tài khoản không hợp lệ.' }

      await createPaymentAccount(accountId, user.id, trimmed, type)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleSetBudgetLimit(
    accountId: string,
    category: TransactionCategory,
    limitAmount: number,
  ): Promise<{ error?: string }> {
    'use server'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const wallet = await getWalletAccess(accountId, user.id)
      if (!wallet || wallet.permission !== 'edit') return { error: 'Bạn không có quyền chỉnh sửa ví này.' }

      if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
        return { error: 'Hạn mức không hợp lệ.' }
      }

      const customCategories = await getUserCategories(accountId)
      if (![...TRANSACTION_CATEGORIES, ...customCategories].includes(category)) {
        return { error: 'Danh mục không hợp lệ.' }
      }

      await setBudgetLimit(accountId, user.id, category, limitAmount)
      revalidatePath('/my-wallet')
      return {}
    } catch {
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar user={user} />
      <WalletDashboard
        summary={summary}
        transactions={transactions}
        categoryBreakdown={categoryBreakdown}
        categories={categories}
        accessibleWallets={accessibleWallets}
        selectedAccount={selectedAccount}
        members={members}
        currentUserId={user.id}
        permission={permission}
        paymentAccounts={paymentAccounts}
        budgetLimits={budgetLimits}
        analytics={analytics}
        onCreatePaymentAccount={handleCreatePaymentAccount.bind(null, selectedAccount.id)}
        onSetBudgetLimit={handleSetBudgetLimit.bind(null, selectedAccount.id)}
        onAddTransaction={handleAddTransaction.bind(null, selectedAccount.id)}
        onAddCategory={handleAddCategory.bind(null, selectedAccount.id)}
        onUpdateTransaction={handleUpdateTransaction.bind(null, selectedAccount.id)}
        onDeleteTransaction={handleDeleteTransaction.bind(null, selectedAccount.id)}
        onRenameWallet={handleRenameWallet.bind(null, selectedAccount.id)}
        onShareWallet={handleShareWallet.bind(null, selectedAccount.id)}
        onRevokeShare={handleRevokeShare.bind(null, selectedAccount.id)}
      />
    </main>
  )
}
