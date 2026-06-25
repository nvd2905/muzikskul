import { revalidatePath } from 'next/cache'
import {
  getClassFundStatus,
  getClassTransactions,
  updateTransactionStatus,
  adjustFundBalance,
} from '@/modules/class-wallet/services'
import FundTable from '@/modules/class-wallet/components/FundTable'
import { getCurrentUser } from '@/modules/auth/actions'
import Navbar from '@/shared/components/Navbar'

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

  async function handleAdjustBalance(delta: number, name: string, reason: string) {
    'use server'
    await adjustFundBalance(FUND_ID, delta, name, reason)
    revalidatePath('/class-wallet')
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar user={user} />
      <FundTable
        fundStatus={fundStatus}
        transactions={transactions}
        onApprove={handleApprove}
        onAdjustBalance={handleAdjustBalance}
      />
    </main>
  )
}
