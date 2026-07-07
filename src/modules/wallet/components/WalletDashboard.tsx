'use client'

import { useState, useTransition } from 'react'
import {
  TRANSACTION_CATEGORIES,
  type PersonalTransaction,
  type TransactionCategory,
  type TransactionType,
  type WalletSummary,
} from '../types'

type ActionResult = { error?: string }

type WalletDashboardProps = {
  summary: WalletSummary
  transactions: PersonalTransaction[]
  onAddTransaction: (
    amount: number,
    type: TransactionType,
    category: TransactionCategory,
    description: string,
  ) => Promise<ActionResult>
}

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  Food: 'Ăn uống',
  Study: 'Học tập',
  Transport: 'Di chuyển',
  Entertainment: 'Giải trí',
  Others: 'Khác',
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function SummaryGrid({ summary }: { summary: WalletSummary }) {
  const isNegative = summary.balance < 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
        <p className="text-sm font-medium text-ink-muted">Số dư hiện tại</p>
        <p
          className={`mt-1 font-jetbrains text-3xl font-bold tracking-tight ${
            isNegative ? 'text-neon-red' : 'text-ink-primary'
          }`}
        >
          {formatVND(summary.balance)}
        </p>
      </div>
      <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
        <p className="text-sm font-medium text-ink-muted">Tổng thu</p>
        <p className="mt-1 font-jetbrains text-3xl font-bold tracking-tight text-neon-green">
          {formatVND(summary.totalIncome)}
        </p>
      </div>
      <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
        <p className="text-sm font-medium text-ink-muted">Tổng chi</p>
        <p className="mt-1 font-jetbrains text-3xl font-bold tracking-tight text-neon-red">
          {formatVND(summary.totalExpense)}
        </p>
      </div>
    </div>
  )
}

function QuickAddForm({ onAdd }: { onAdd: WalletDashboardProps['onAddTransaction'] }) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<TransactionCategory>('Food')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const value = parseInt(amount, 10)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ.')
      return
    }
    startTransition(async () => {
      const result = await onAdd(value, type, category, description.trim())
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setAmount('')
      setDescription('')
    })
  }

  const inputClass =
    'rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Thêm giao dịch nhanh</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex w-fit overflow-hidden rounded-lg border border-surface-border">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`px-4 py-1.5 text-xs font-semibold transition ${
              type === 'income' ? 'bg-neon-green/10 text-neon-green' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            + Thu nhập
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`px-4 py-1.5 text-xs font-semibold transition ${
              type === 'expense' ? 'bg-neon-red/10 text-neon-red' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            − Chi tiêu
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Số tiền (VNĐ)"
            className={`font-jetbrains ${inputClass}`}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value as TransactionCategory)}
            className={inputClass}
          >
            {TRANSACTION_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Mô tả (tuỳ chọn)"
          className={`w-full ${inputClass}`}
        />

        <button
          type="submit"
          disabled={!amount || isPending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-ink-primary transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Đang lưu...' : 'Thêm giao dịch'}
        </button>

        {error && <p className="text-xs font-medium text-neon-red">{error}</p>}
      </form>
    </div>
  )
}

function TransactionRow({ tx }: { tx: PersonalTransaction }) {
  const isIncome = tx.type === 'income'

  return (
    <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-elevated">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isIncome ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'
          }`}
        >
          {isIncome ? '+' : '−'}
        </span>
        <div>
          <p className="text-sm font-medium text-ink-primary">{tx.description || CATEGORY_LABELS[tx.category]}</p>
          <p className="text-xs text-ink-muted">
            {CATEGORY_LABELS[tx.category]} · {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>
      <p className={`font-jetbrains text-sm font-semibold ${isIncome ? 'text-neon-green' : 'text-neon-red'}`}>
        {isIncome ? '+' : '−'}
        {formatVND(tx.amount)}
      </p>
    </div>
  )
}

export default function WalletDashboard({ summary, transactions, onAddTransaction }: WalletDashboardProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-orbitron text-2xl font-bold text-ink-primary">My Wallet</h1>
        <p className="mt-1 text-sm text-ink-secondary">Theo dõi thu chi cá nhân của bạn</p>
      </div>

      <SummaryGrid summary={summary} />

      <QuickAddForm onAdd={onAddTransaction} />

      <div className="rounded-xl border border-surface-border bg-surface-card shadow-card">
        <div className="border-b border-surface-border px-6 py-4">
          <h3 className="text-base font-semibold text-ink-primary">Lịch sử giao dịch</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-muted">Chưa có giao dịch nào.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {transactions.map(tx => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
