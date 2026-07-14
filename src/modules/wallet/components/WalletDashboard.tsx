'use client'

import { useState, useTransition } from 'react'
import type {
  AccessibleWallet,
  AnalyticsSummary,
  BudgetLimit,
  CategoryBreakdown,
  PaymentAccount,
  PaymentAccountType,
  PersonalAccount,
  PersonalTransaction,
  SharePermission,
  TransactionCategory,
  TransactionType,
  WalletMember,
  WalletSummary,
} from '../types'
import MoneyInput, { parseMoneyInput } from '@/shared/components/MoneyInput'
import Tabs from '@/shared/components/Tabs'
import AccountsMatrix from './AccountsMatrix'
import AnalyticsSection from './AnalyticsSection'
import BudgetProgressBars from './BudgetProgressBars'
import ShareWalletPanel from './ShareWalletPanel'
import WalletSwitcher from './WalletSwitcher'

type ActionResult = { error?: string }

type WalletDashboardProps = {
  summary: WalletSummary
  transactions: PersonalTransaction[]
  categoryBreakdown: CategoryBreakdown[]
  categories: string[]
  accessibleWallets: AccessibleWallet[]
  selectedAccount: PersonalAccount
  members: WalletMember[]
  currentUserId: string
  permission: SharePermission
  paymentAccounts: PaymentAccount[]
  budgetLimits: BudgetLimit[]
  analytics: AnalyticsSummary
  onCreatePaymentAccount: (name: string, type: PaymentAccountType) => Promise<ActionResult>
  onSetBudgetLimit: (category: TransactionCategory, limitAmount: number) => Promise<ActionResult>
  onAddTransaction: (
    amount: number,
    type: TransactionType,
    category: TransactionCategory,
    description: string,
    paymentAccountId: string | null,
  ) => Promise<ActionResult>
  onAddCategory: (name: string) => Promise<ActionResult>
  onUpdateTransaction: (
    transactionId: string,
    amount: number,
    type: TransactionType,
    category: TransactionCategory,
    description: string,
    paymentAccountId: string | null,
  ) => Promise<ActionResult>
  onDeleteTransaction: (transactionId: string) => Promise<ActionResult>
  onRenameWallet: (name: string) => Promise<ActionResult>
  onShareWallet: (email: string, permission: SharePermission) => Promise<ActionResult>
  onRevokeShare: (userId: string) => Promise<ActionResult>
}

const CATEGORY_LABELS: Record<string, string> = {
  Food: 'Ăn uống',
  Study: 'Học tập',
  Transport: 'Di chuyển',
  Entertainment: 'Giải trí',
  Others: 'Khác',
}

// Custom, user-added categories have no built-in translation — show them as-is.
function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function SummaryGrid({ summary }: { summary: WalletSummary }) {
  const isNegative = summary.balance < 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
        <p className="text-sm font-medium text-ink-muted">Số dư hiện tại</p>
        <p
          className={`mt-1 font-jetbrains text-3xl font-bold tracking-tight ${
            isNegative ? 'text-neon-red' : 'text-ink-primary'
          }`}
        >
          {formatVND(summary.balance)}
        </p>
      </div>
      <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
        <p className="text-sm font-medium text-ink-muted">Tổng thu</p>
        <p className="mt-1 font-jetbrains text-3xl font-bold tracking-tight text-neon-green">
          {formatVND(summary.totalIncome)}
        </p>
      </div>
      <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
        <p className="text-sm font-medium text-ink-muted">Tổng chi</p>
        <p className="mt-1 font-jetbrains text-3xl font-bold tracking-tight text-neon-red">
          {formatVND(summary.totalExpense)}
        </p>
      </div>
    </div>
  )
}

function CategoryBreakdownCard({ breakdown }: { breakdown: CategoryBreakdown[] }) {
  if (breakdown.length === 0) return null

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Chi tiêu theo danh mục</h3>
      <div className="space-y-3">
        {breakdown.map(item => (
          <div key={item.category}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-primary">{categoryLabel(item.category)}</span>
              <span className="font-jetbrains text-ink-secondary">{formatVND(item.total)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full rounded-full bg-brand transition-all duration-700"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <p className="mt-0.5 text-right font-jetbrains text-xs text-ink-muted">{item.percentage.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickAddForm({
  categories,
  paymentAccounts,
  onAdd,
  onAddCategory,
}: {
  categories: string[]
  paymentAccounts: PaymentAccount[]
  onAdd: WalletDashboardProps['onAddTransaction']
  onAddCategory: WalletDashboardProps['onAddCategory']
}) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<TransactionCategory>(categories[0] ?? '')
  const [description, setDescription] = useState('')
  const [paymentAccountId, setPaymentAccountId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [isAddingCategoryPending, startAddCategoryTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const value = parseMoneyInput(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ.')
      return
    }
    startTransition(async () => {
      const result = await onAdd(value, type, category, description.trim(), paymentAccountId || null)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setAmount('')
      setDescription('')
    })
  }

  function handleAddCategory() {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    startAddCategoryTransition(async () => {
      const result = await onAddCategory(trimmed)
      if (result.error) {
        setCategoryError(result.error)
        return
      }
      setCategoryError(null)
      setCategory(trimmed)
      setNewCategoryName('')
      setIsAddingCategory(false)
    })
  }

  const inputClass =
    'rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Thêm giao dịch nhanh</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex overflow-hidden rounded-lg border border-surface-border sm:w-fit">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 px-4 py-2 text-xs font-semibold transition sm:flex-none sm:py-1.5 ${
              type === 'income' ? 'bg-neon-green/10 text-neon-green' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            + Thu nhập
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 px-4 py-2 text-xs font-semibold transition sm:flex-none sm:py-1.5 ${
              type === 'expense' ? 'bg-neon-red/10 text-neon-red' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            − Chi tiêu
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MoneyInput
            value={amount}
            onChange={setAmount}
            placeholder="Số tiền (VNĐ)"
            className={`font-jetbrains ${inputClass}`}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className={inputClass}
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <select value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)} className={inputClass}>
          <option value="">Nguồn tiền (không xác định)</option>
          {paymentAccounts.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {!isAddingCategory ? (
          <button
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="text-xs font-medium text-brand-light hover:text-brand"
          >
            + Thêm danh mục mới
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Tên danh mục mới"
              className={`flex-1 ${inputClass}`}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || isAddingCategoryPending}
                className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {isAddingCategoryPending ? '...' : 'Thêm'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false)
                  setNewCategoryName('')
                  setCategoryError(null)
                }}
                className="flex-1 rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-ink-secondary transition hover:border-brand hover:text-brand-light sm:flex-none"
              >
                Huỷ
              </button>
            </div>
          </div>
        )}
        {categoryError && <p className="text-xs font-medium text-neon-red">{categoryError}</p>}

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

function WalletNameEditor({
  name,
  onRename,
}: {
  name: string
  onRename: WalletDashboardProps['onRenameWallet']
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const inputClass =
    'rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="font-orbitron text-2xl font-bold text-ink-primary">{name}</h1>
        <button
          type="button"
          onClick={() => {
            setValue(name)
            setError(null)
            setIsEditing(true)
          }}
          aria-label="Đổi tên ví"
          title="Đổi tên ví"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-surface-border text-ink-secondary transition hover:border-brand hover:text-brand-light"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
      </div>
    )
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Vui lòng nhập tên ví.')
      return
    }
    startTransition(async () => {
      const result = await onRename(trimmed)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setIsEditing(false)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        autoFocus
        maxLength={50}
        className={`font-orbitron font-bold ${inputClass}`}
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? '...' : 'Lưu'}
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-secondary transition hover:border-brand hover:text-brand-light"
      >
        Huỷ
      </button>
      {error && <p className="w-full text-xs font-medium text-neon-red">{error}</p>}
    </form>
  )
}

function TransactionRow({
  tx,
  showCreator,
  canEdit,
  categories,
  paymentAccounts,
  onUpdate,
  onDelete,
}: {
  tx: PersonalTransaction
  showCreator: boolean
  canEdit: boolean
  categories: string[]
  paymentAccounts: PaymentAccount[]
  onUpdate: WalletDashboardProps['onUpdateTransaction']
  onDelete: WalletDashboardProps['onDeleteTransaction']
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [type, setType] = useState<TransactionType>(tx.type)
  const [amount, setAmount] = useState(tx.amount.toLocaleString('vi-VN'))
  const [category, setCategory] = useState<TransactionCategory>(tx.category)
  const [description, setDescription] = useState(tx.description ?? '')
  const [paymentAccountId, setPaymentAccountId] = useState(tx.paymentAccountId ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSaveTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const isIncome = tx.type === 'income'
  const inputClass =
    'rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'
  const accountName = paymentAccounts.find(a => a.id === tx.paymentAccountId)?.name

  function handleSave(e: React.SyntheticEvent) {
    e.preventDefault()
    const value = parseMoneyInput(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ.')
      return
    }
    startSaveTransition(async () => {
      const result = await onUpdate(tx.id, value, type, category, description.trim(), paymentAccountId || null)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setIsEditing(false)
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await onDelete(tx.id)
    })
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-3 px-4 py-4 sm:px-6">
        <div className="flex overflow-hidden rounded-lg border border-surface-border sm:w-fit">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 px-4 py-2 text-xs font-semibold transition sm:flex-none sm:py-1.5 ${
              type === 'income' ? 'bg-neon-green/10 text-neon-green' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            + Thu nhập
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 px-4 py-2 text-xs font-semibold transition sm:flex-none sm:py-1.5 ${
              type === 'expense' ? 'bg-neon-red/10 text-neon-red' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            − Chi tiêu
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MoneyInput value={amount} onChange={setAmount} className={`font-jetbrains ${inputClass}`} />
          <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
            {categories.map(c => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <select value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)} className={inputClass}>
          <option value="">Nguồn tiền (không xác định)</option>
          {paymentAccounts.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Mô tả (tuỳ chọn)"
          className={`w-full ${inputClass}`}
        />
        {error && <p className="text-xs font-medium text-neon-red">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-secondary transition hover:border-brand hover:text-brand-light"
          >
            Huỷ
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="group flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-surface-elevated sm:px-6">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isIncome ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'
          }`}
        >
          {isIncome ? '+' : '−'}
        </span>
        <div>
          <p className="text-sm font-medium text-ink-primary">{tx.description || categoryLabel(tx.category)}</p>
          <p className="text-xs text-ink-muted">
            {categoryLabel(tx.category)} · {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
            {accountName && ` · ${accountName}`}
            {showCreator && ` · Tạo bởi ${tx.creatorName ?? 'Không rõ'}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={`font-jetbrains text-sm font-semibold ${isIncome ? 'text-neon-green' : 'text-neon-red'}`}>
          {isIncome ? '+' : '−'}
          {formatVND(tx.amount)}
        </p>
        {canEdit && (
          <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-brand-light hover:text-brand"
            >
              Sửa
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="text-xs font-medium text-neon-red hover:text-neon-red/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? '...' : 'Xoá'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WalletDashboard({
  summary,
  transactions,
  categoryBreakdown,
  categories,
  accessibleWallets,
  selectedAccount,
  members,
  currentUserId,
  permission,
  paymentAccounts,
  budgetLimits,
  analytics,
  onCreatePaymentAccount,
  onSetBudgetLimit,
  onAddTransaction,
  onAddCategory,
  onUpdateTransaction,
  onDeleteTransaction,
  onRenameWallet,
  onShareWallet,
  onRevokeShare,
}: WalletDashboardProps) {
  const isOwner = selectedAccount.ownerId === currentUserId
  const canEdit = permission === 'edit'
  const showCreator = members.length > 1

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          {isOwner ? (
            <WalletNameEditor name={selectedAccount.name} onRename={onRenameWallet} />
          ) : (
            <h1 className="font-orbitron text-2xl font-bold text-ink-primary">{selectedAccount.name}</h1>
          )}
          <p className="mt-1 text-sm text-ink-secondary">Theo dõi thu chi cá nhân của bạn</p>
        </div>
        <WalletSwitcher wallets={accessibleWallets} selectedAccountId={selectedAccount.id} />
      </div>

      <SummaryGrid summary={summary} />

      <Tabs
        tabs={[
          { id: 'overview', label: 'Tổng quan' },
          { id: 'budget', label: 'Hạn mức' },
          { id: 'transactions', label: 'Giao dịch' },
          { id: 'sharing', label: 'Chia sẻ' },
        ]}
      >
        {activeTabId => (
          <>
            {activeTabId === 'overview' && (
              <div className="space-y-6">
                <AccountsMatrix accounts={paymentAccounts} canEdit={canEdit} onCreateAccount={onCreatePaymentAccount} />
                <AnalyticsSection analytics={analytics} />
                <CategoryBreakdownCard breakdown={categoryBreakdown} />
              </div>
            )}

            {activeTabId === 'budget' && (
              <BudgetProgressBars
                budgetLimits={budgetLimits}
                categories={categories}
                canEdit={canEdit}
                onSetBudgetLimit={onSetBudgetLimit}
              />
            )}

            {activeTabId === 'transactions' && (
              <div className="space-y-6">
                {canEdit ? (
                  <QuickAddForm
                    categories={categories}
                    paymentAccounts={paymentAccounts}
                    onAdd={onAddTransaction}
                    onAddCategory={onAddCategory}
                  />
                ) : (
                  <div className="rounded-xl border border-surface-border bg-surface-card p-4 text-center shadow-card sm:p-6">
                    <p className="text-sm text-ink-muted">Bạn chỉ có quyền xem ví này.</p>
                  </div>
                )}

                <div className="rounded-xl border border-surface-border bg-surface-card shadow-card">
                  <div className="border-b border-surface-border px-4 py-4 sm:px-6">
                    <h3 className="text-base font-semibold text-ink-primary">Lịch sử giao dịch</h3>
                  </div>
                  {transactions.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-ink-muted sm:px-6">Chưa có giao dịch nào.</p>
                  ) : (
                    <div className="divide-y divide-surface-border">
                      {transactions.map(tx => (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          showCreator={showCreator}
                          canEdit={canEdit}
                          categories={categories}
                          paymentAccounts={paymentAccounts}
                          onUpdate={onUpdateTransaction}
                          onDelete={onDeleteTransaction}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTabId === 'sharing' && (
              <ShareWalletPanel
                members={members}
                currentUserId={currentUserId}
                isOwner={isOwner}
                onShareWallet={onShareWallet}
                onRevokeShare={onRevokeShare}
              />
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}
