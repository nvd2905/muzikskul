import { revalidatePath } from 'next/cache'
import {
  getClassFundStatus,
  getClassTransactions,
  getTopDonors,
  approveTransaction,
  rejectTransaction,
  adjustFundBalance,
  reportPayment,
} from '@/modules/class-wallet/services'
import FundTable from '@/modules/class-wallet/components/FundTable'
import { getCurrentUser, requireAdmin } from '@/modules/auth/actions'
import Navbar from '@/shared/components/Navbar'

const FUND_ID = 'fund-002'

export default async function ClassWalletPage() {
  const [fundStatus, transactions, topDonors, user] = await Promise.all([
    getClassFundStatus(FUND_ID),
    getClassTransactions(FUND_ID),
    getTopDonors(FUND_ID),
    getCurrentUser(),
  ])

  async function handleApprove(transactionId: string): Promise<{ error?: string }> {
    'use server'
    try {
      await requireAdmin()
      await approveTransaction(FUND_ID, transactionId)
      revalidatePath('/class-wallet')
      return {}
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unauthorized')) {
        return { error: 'Bạn không có quyền duyệt giao dịch.' }
      }
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleReject(transactionId: string): Promise<{ error?: string }> {
    'use server'
    try {
      await requireAdmin()
      await rejectTransaction(transactionId)
      revalidatePath('/class-wallet')
      return {}
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unauthorized')) {
        return { error: 'Bạn không có quyền từ chối giao dịch.' }
      }
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleReportPayment(
    amount: number,
    payerName: string,
    reason: string,
  ): Promise<{ error?: string }> {
    'use server'
    try {
      const reporter = await getCurrentUser()
      if (!reporter) throw new Error('Unauthorized')
      if (!Number.isFinite(amount) || amount <= 0 || !payerName.trim()) {
        return { error: 'Vui lòng nhập số tiền và tên hợp lệ.' }
      }
      await reportPayment(FUND_ID, amount, payerName.trim(), reason.trim() || 'Chuyển khoản Momo', reporter.id)
      revalidatePath('/class-wallet')
      return {}
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unauthorized')) {
        return { error: 'Bạn cần đăng nhập để báo đã chuyển khoản.' }
      }
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  async function handleAdjustBalance(delta: number, name: string, reason: string): Promise<{ error?: string }> {
    'use server'
    try {
      await requireAdmin()
      await adjustFundBalance(FUND_ID, delta, name, reason)
      revalidatePath('/class-wallet')
      return {}
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unauthorized')) {
        return { error: 'Bạn không có quyền điều chỉnh số dư.' }
      }
      return { error: 'Đã có lỗi xảy ra, vui lòng thử lại.' }
    }
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar user={user} />
      <FundTable
        fundStatus={fundStatus}
        transactions={transactions}
        topDonors={topDonors}
        defaultPayerName={user?.name ?? ''}
        isAdmin={user?.role === 'admin'}
        onApprove={handleApprove}
        onReject={handleReject}
        onAdjustBalance={handleAdjustBalance}
        onReportPayment={handleReportPayment}
      />
    </main>
  )
}
