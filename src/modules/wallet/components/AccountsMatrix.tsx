'use client'

import { useState, useTransition } from 'react'
import type { PaymentAccount, PaymentAccountType } from '../types'

type ActionResult = { error?: string }

type AccountsMatrixProps = {
  accounts: PaymentAccount[]
  canEdit: boolean
  onCreateAccount: (name: string, type: PaymentAccountType) => Promise<ActionResult>
}

const TYPE_LABELS: Record<PaymentAccountType, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  other: 'Khác',
}

const TYPE_ICONS: Record<PaymentAccountType, string> = {
  cash: '💵',
  bank: '🏦',
  other: '💠',
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function AddAccountForm({ onCreateAccount }: { onCreateAccount: AccountsMatrixProps['onCreateAccount'] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<PaymentAccountType>('cash')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const inputClass =
    'rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-[104px] items-center justify-center rounded-xl border border-dashed border-surface-border text-sm font-medium text-ink-muted transition hover:border-brand hover:text-brand-light"
      >
        + Thêm tài khoản
      </button>
    )
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Vui lòng nhập tên tài khoản.')
      return
    }
    startTransition(async () => {
      const result = await onCreateAccount(trimmed, type)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setName('')
      setIsOpen(false)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[104px] flex-col gap-2 rounded-xl border border-surface-border bg-surface-card p-4 shadow-card"
    >
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Tên tài khoản"
        autoFocus
        maxLength={30}
        className={inputClass}
      />
      <div className="flex gap-2">
        <select value={type} onChange={e => setType(e.target.value as PaymentAccountType)} className={`flex-1 ${inputClass}`}>
          {(Object.keys(TYPE_LABELS) as PaymentAccountType[]).map(t => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? '...' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-ink-secondary transition hover:border-brand hover:text-brand-light"
        >
          Huỷ
        </button>
      </div>
      {error && <p className="text-xs font-medium text-neon-red">{error}</p>}
    </form>
  )
}

export default function AccountsMatrix({ accounts, canEdit, onCreateAccount }: AccountsMatrixProps) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-ink-primary">Tài khoản</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map(account => {
          const isNegative = account.balance < 0
          return (
            <div
              key={account.id}
              className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card transition-shadow hover:shadow-card-hover sm:p-5"
            >
              <div className="flex items-center gap-2 text-sm text-ink-secondary">
                <span aria-hidden="true">{TYPE_ICONS[account.type]}</span>
                <span className="font-medium text-ink-primary">{account.name}</span>
              </div>
              <p
                className={`mt-2 font-jetbrains text-xl font-bold tracking-tight ${
                  isNegative ? 'text-neon-red' : 'text-accent-light'
                }`}
              >
                {formatVND(account.balance)}
              </p>
            </div>
          )
        })}
        {canEdit && <AddAccountForm onCreateAccount={onCreateAccount} />}
      </div>
    </div>
  )
}
