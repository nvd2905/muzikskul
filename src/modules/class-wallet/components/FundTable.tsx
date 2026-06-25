'use client'

import { useState, useTransition } from 'react'
import type { FundStatus, Transaction } from '../services'

interface FundTableProps {
  fundStatus: FundStatus
  transactions: Transaction[]
  onApprove: (transactionId: string) => Promise<void>
  onAdjustBalance: (delta: number, name: string, reason: string) => Promise<void>
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function AdjustBalanceForm({ onAdjust }: { onAdjust: (delta: number, name: string, reason: string) => Promise<void> }) {
  const [type, setType] = useState<'add' | 'deduct'>('add')
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const value = parseInt(amount, 10)
    if (!value || value <= 0 || !name.trim() || !reason.trim()) return
    const delta = type === 'add' ? value : -value
    startTransition(async () => {
      await onAdjust(delta, name.trim(), reason.trim())
      setAmount('')
      setName('')
      setReason('')
    })
  }

  const inputClass = 'rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t border-surface-border pt-4">
      <p className="text-xs font-medium text-ink-muted">Điều chỉnh số dư</p>
      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-surface-border">
          <button
            type="button"
            onClick={() => setType('add')}
            className={`px-3 py-1.5 text-xs font-semibold transition ${
              type === 'add' ? 'bg-neon-green/10 text-neon-green' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            + Nạp
          </button>
          <button
            type="button"
            onClick={() => setType('deduct')}
            className={`px-3 py-1.5 text-xs font-semibold transition ${
              type === 'deduct' ? 'bg-neon-red/10 text-neon-red' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            − Rút
          </button>
        </div>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Số tiền (VNĐ)"
          className={`flex-1 font-jetbrains ${inputClass}`}
        />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tên người điều chỉnh"
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Lý do"
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="submit"
          disabled={!amount || !name.trim() || !reason.trim() || isPending}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? '...' : 'Lưu'}
        </button>
      </div>
    </form>
  )
}

function BudgetSummaryCard({ fundStatus, onAdjust }: { fundStatus: FundStatus; onAdjust: (delta: number) => Promise<void> }) {
  const { balance, className, targetBudget } = fundStatus
  const pct = Math.min((balance / targetBudget) * 100, 100)
  const isLow = pct < 50
  const isComplete = pct >= 100

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-muted">Quỹ lớp</p>
          <h2 className="text-2xl font-bold text-ink-primary">{className}</h2>
        </div>

        {isLow && !isComplete && (
          <div className="flex items-center gap-2 rounded-full bg-neon-yellow/10 px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-yellow opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon-yellow" />
            </span>
            <span className="text-xs font-semibold text-neon-yellow">Chưa đạt 50% mục tiêu</span>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 rounded-full bg-neon-green/10 px-3 py-1.5">
            <span className="text-xs font-semibold text-neon-green">✓ Đạt mục tiêu</span>
          </div>
        )}
      </div>

      <p className="mb-1 font-jetbrains text-4xl font-bold tracking-tight text-ink-primary">
        {formatVND(balance)}
      </p>
      <p className="mb-4 text-sm text-ink-muted">
        Mục tiêu: {formatVND(targetBudget)}
      </p>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isComplete ? 'bg-neon-green' : isLow ? 'bg-neon-yellow' : 'bg-brand'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-right font-jetbrains text-xs text-ink-muted">{pct.toFixed(1)}%</p>
      <AdjustBalanceForm onAdjust={onAdjust} />
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
    <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Thu tiền qua VietQR</h3>

      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="flex-shrink-0">
          <div className="flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-surface-border bg-surface-elevated">
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 49 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3.5 w-3.5 rounded-sm ${
                    [0,1,2,3,4,5,6,7,14,21,28,35,42,43,44,45,46,47,48,8,13,15,20,36,41,24,25,10,12,38,40].includes(i)
                      ? 'bg-accent'
                      : 'bg-surface-elevated'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-ink-muted">Mock QR</p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-ink-muted">Ngân hàng</p>
            <p className="font-semibold text-ink-primary">{bankName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Số tài khoản</p>
            <div className="flex items-center gap-2">
              <p className="font-jetbrains font-semibold tracking-widest text-ink-primary">{accountNumber}</p>
              <button
                onClick={handleCopy}
                className="rounded-md border border-surface-border bg-surface-elevated px-2 py-0.5 text-xs text-ink-secondary transition hover:border-brand hover:text-brand-light"
              >
                {copied ? '✓ Đã sao chép' : 'Sao chép'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Nội dung chuyển khoản</p>
            <p className="font-semibold text-ink-primary">Quy {className}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Số tiền gợi ý</p>
            <p className="font-jetbrains text-lg font-bold text-accent">{formatVND(amount)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-neon-green/10 px-2.5 py-1 text-xs font-semibold text-neon-green">
        <span className="h-1.5 w-1.5 rounded-full bg-neon-green" />
        Đã duyệt
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neon-yellow/10 px-2.5 py-1 text-xs font-semibold text-neon-yellow">
      <span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-neon-yellow opacity-75" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-neon-yellow" />
      Chờ duyệt
    </span>
  )
}

export default function FundTable({ fundStatus, transactions, onApprove, onAdjustBalance }: FundTableProps) {
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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-orbitron text-2xl font-bold text-ink-primary">Quản lý quỹ lớp</h1>
          <p className="mt-1 text-sm text-ink-secondary">Theo dõi thu chi và duyệt thanh toán</p>
        </div>

        <BudgetSummaryCard fundStatus={fundStatus} onAdjust={onAdjustBalance} />

        <VietQRCard amount={suggestedAmount} className={fundStatus.className} />

        <div className="rounded-xl border border-surface-border bg-surface-card shadow-card">
          <div className="border-b border-surface-border px-6 py-4">
            <h3 className="text-base font-semibold text-ink-primary">Giao dịch gần đây</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-elevated text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Người nộp</th>
                  <th className="px-6 py-3">Lý do</th>
                  <th className="px-6 py-3">Số tiền</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {transactions.map((tx, index) => (
                  <tr key={tx.id} className="transition-colors hover:bg-surface-elevated">
                    <td className="px-6 py-4 font-jetbrains text-ink-muted">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-ink-primary">{tx.payerName}</td>
                    <td className="px-6 py-4 text-ink-secondary">{tx.note ?? <span className="text-ink-muted">—</span>}</td>
                    <td className="px-6 py-4 font-jetbrains font-semibold text-ink-primary">{formatVND(tx.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(tx.id)}
                          disabled={isPending && approvingId === tx.id}
                          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base disabled:cursor-not-allowed disabled:opacity-50"
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
