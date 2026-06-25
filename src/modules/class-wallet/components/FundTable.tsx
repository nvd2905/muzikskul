'use client'

import { useState, useTransition } from 'react'
import type { FundStatus, Transaction } from '../services'

interface FundTableProps {
  fundStatus: FundStatus
  transactions: Transaction[]
  onApprove: (transactionId: string) => Promise<void>
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function BudgetSummaryCard({ fundStatus }: { fundStatus: FundStatus }) {
  const { balance, className, targetBudget } = fundStatus
  const pct = Math.min((balance / targetBudget) * 100, 100)
  const isLow = pct < 50
  const isComplete = pct >= 100

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Quỹ lớp</p>
          <h2 className="text-2xl font-bold text-gray-900">{className}</h2>
        </div>

        {isLow && !isComplete && (
          <div className="flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
            </span>
            <span className="text-xs font-semibold text-yellow-700">Chưa đạt 50% mục tiêu</span>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5">
            <span className="text-xs font-semibold text-green-700">✓ Đạt mục tiêu</span>
          </div>
        )}
      </div>

      <p className="mb-1 text-4xl font-extrabold tracking-tight text-gray-900">
        {formatVND(balance)}
      </p>
      <p className="mb-4 text-sm text-gray-400">
        Mục tiêu: {formatVND(targetBudget)}
      </p>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isComplete ? 'bg-green-500' : isLow ? 'bg-yellow-400' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-gray-400">{pct.toFixed(1)}%</p>
    </div>
  )
}

function VietQRCard({ amount, className }: { amount: number; className: string }) {
  const [copied, setCopied] = useState(false)
  const accountNumber = '1234567890'
  const bankName = 'MB Bank'

  function handleCopy() {
    navigator.clipboard.writeText(accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-800">Thu tiền qua VietQR</h3>

      <div className="flex flex-col items-start gap-6 sm:flex-row">
        {/* Mock QR placeholder */}
        <div className="flex-shrink-0">
          <div className="flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 49 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3.5 w-3.5 rounded-sm ${
                    [0,1,2,3,4,5,6,7,14,21,28,35,42,43,44,45,46,47,48,8,13,15,20,36,41,24,25,10,12,38,40].includes(i)
                      ? 'bg-gray-800'
                      : 'bg-gray-50'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-400">Mock QR</p>
        </div>

        {/* Bank info */}
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-400">Ngân hàng</p>
            <p className="font-semibold text-gray-800">{bankName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Số tài khoản</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold tracking-widest text-gray-800">{accountNumber}</p>
              <button
                onClick={handleCopy}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 transition hover:bg-gray-200"
              >
                {copied ? '✓ Đã sao chép' : 'Sao chép'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Nội dung chuyển khoản</p>
            <p className="font-semibold text-gray-800">Quy {className}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Số tiền gợi ý</p>
            <p className="text-lg font-bold text-blue-600">{formatVND(amount)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Đã duyệt
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
      Chờ duyệt
    </span>
  )
}

export default function FundTable({ fundStatus, transactions, onApprove }: FundTableProps) {
  const [isPending, startTransition] = useTransition()
  const [approvingId, setApprovingId] = useState<string | null>(null)

  function handleApprove(id: string) {
    setApprovingId(id)
    startTransition(async () => {
      await onApprove(id)
      setApprovingId(null)
    })
  }

  const suggestedAmount = Math.round(
    (fundStatus.targetBudget - fundStatus.balance) / Math.max(transactions.filter(t => t.status === 'pending').length, 1)
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Quản lý quỹ lớp</h1>
        <p className="text-sm text-gray-500">Theo dõi thu chi và duyệt thanh toán</p>
      </div>

      <BudgetSummaryCard fundStatus={fundStatus} />

      <VietQRCard amount={suggestedAmount} className={fundStatus.className} />

      {/* Transaction table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-800">Giao dịch gần đây</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Người nộp</th>
                <th className="px-6 py-3">Số tiền</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((tx, index) => (
                <tr key={tx.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{tx.payerName}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{formatVND(tx.amount)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-6 py-4">
                    {tx.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(tx.id)}
                        disabled={isPending && approvingId === tx.id}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPending && approvingId === tx.id ? 'Đang duyệt...' : 'Duyệt'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
