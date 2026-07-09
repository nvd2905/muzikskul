'use client'

import { useState, useTransition } from 'react'
import type { BudgetLimit, TransactionCategory } from '../types'

type ActionResult = { error?: string }

type BudgetProgressBarsProps = {
  budgetLimits: BudgetLimit[]
  categories: string[]
  canEdit: boolean
  onSetBudgetLimit: (category: TransactionCategory, limitAmount: number) => Promise<ActionResult>
}

const CATEGORY_LABELS: Record<string, string> = {
  Food: 'Ăn uống',
  Study: 'Học tập',
  Transport: 'Di chuyển',
  Entertainment: 'Giải trí',
  Others: 'Khác',
}

function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function SetLimitForm({
  categories,
  onSetBudgetLimit,
}: {
  categories: string[]
  onSetBudgetLimit: BudgetProgressBarsProps['onSetBudgetLimit']
}) {
  const [category, setCategory] = useState<TransactionCategory>(categories[0] ?? '')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const inputClass =
    'rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const value = parseInt(amount, 10)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Vui lòng nhập hạn mức hợp lệ.')
      return
    }
    startTransition(async () => {
      const result = await onSetBudgetLimit(category, value)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setAmount('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
        {categories.map(c => (
          <option key={c} value={c}>
            {categoryLabel(c)}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Hạn mức (VNĐ)"
        className={`font-jetbrains ${inputClass}`}
      />
      <button
        type="submit"
        disabled={!amount || isPending}
        className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? '...' : 'Đặt hạn mức'}
      </button>
      {error && <p className="text-xs font-medium text-neon-red sm:basis-full">{error}</p>}
    </form>
  )
}

export default function BudgetProgressBars({
  budgetLimits,
  categories,
  canEdit,
  onSetBudgetLimit,
}: BudgetProgressBarsProps) {
  if (budgetLimits.length === 0 && !canEdit) return null

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Hạn mức chi tiêu</h3>
      {budgetLimits.length === 0 ? (
        <p className="text-sm text-ink-muted">Chưa có hạn mức nào được đặt.</p>
      ) : (
        <div className="space-y-4">
          {budgetLimits.map(item => {
            const isOverThreshold = item.percentage >= 90
            const isOverLimit = item.percentage >= 100
            const barWidth = Math.min(item.percentage, 100)
            return (
              <div key={item.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-primary">{categoryLabel(item.category)}</span>
                  <span className="font-jetbrains text-ink-secondary">
                    {formatVND(item.spent)} / {formatVND(item.limitAmount)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isOverThreshold ? 'animate-pulse bg-neon-red' : 'bg-accent'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p
                  className={`mt-0.5 text-right font-jetbrains text-xs ${
                    isOverThreshold ? 'font-semibold text-neon-red' : 'text-ink-muted'
                  }`}
                >
                  {item.percentage.toFixed(1)}%{isOverLimit && ' · Vượt hạn mức'}
                </p>
              </div>
            )
          })}
        </div>
      )}
      {canEdit && <SetLimitForm categories={categories} onSetBudgetLimit={onSetBudgetLimit} />}
    </div>
  )
}
