import { revalidatePath } from 'next/cache'
import {
  getClassFundStatus,
  getClassTransactions,
  updateTransactionStatus,
} from '@/modules/class-wallet/services'
import FundTable from '@/modules/class-wallet/components/FundTable'
import { getCurrentUser, signOut } from '@/modules/auth/actions'

const FUND_ID = 'fund-001'

export default async function ClassWalletPage() {
  const [fundStatus, transactions, user] = await Promise.all([
    getClassFundStatus(FUND_ID),
    getClassTransactions(FUND_ID),
    getCurrentUser(),
  ])

  async function handleApprove(transactionId: string) {
    'use server'
    await updateTransactionStatus(transactionId, 'approved')
    revalidatePath('/class-wallet')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <span className="text-sm font-medium text-gray-700">
          {user?.name ?? user?.email ?? 'User'}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Sign out
          </button>
        </form>
      </header>
      <FundTable
        fundStatus={fundStatus}
        transactions={transactions}
        onApprove={handleApprove}
      />
    </main>
  )
}
