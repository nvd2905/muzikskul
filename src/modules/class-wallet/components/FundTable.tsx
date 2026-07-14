'use client'

import { useMemo, useState, useTransition } from 'react'
import MoneyInput, { parseMoneyInput } from '@/shared/components/MoneyInput'
import type { FundStatus, Transaction, TopDonor } from '../services'

type ActionResult = { error?: string }
type StatusFilter = 'all' | Transaction['status']

const PAGE_SIZE = 10

interface FundTableProps {
  fundStatus: FundStatus
  transactions: Transaction[]
  topDonors: TopDonor[]
  defaultPayerName: string
  isAdmin: boolean
  onApprove: (transactionId: string) => Promise<ActionResult>
  onReject: (transactionId: string) => Promise<ActionResult>
  onAdjustBalance: (delta: number, name: string, reason: string) => Promise<ActionResult>
  onReportPayment: (amount: number, payerName: string, reason: string) => Promise<ActionResult>
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function AdjustBalanceForm({ onAdjust }: { onAdjust: (delta: number, name: string, reason: string) => Promise<ActionResult> }) {
  const [type, setType] = useState<'add' | 'deduct'>('add')
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const value = parseMoneyInput(amount)
    if (!value || value <= 0 || !name.trim() || !reason.trim()) return
    const delta = type === 'add' ? value : -value
    startTransition(async () => {
      const result = await onAdjust(delta, name.trim(), reason.trim())
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
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
        <MoneyInput
          value={amount}
          onChange={setAmount}
          placeholder="Số tiền (VNĐ)"
          className={`flex-1 font-jetbrains ${inputClass}`}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
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
          className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5"
        >
          {isPending ? '...' : 'Lưu'}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-neon-red">{error}</p>}
    </form>
  )
}

function BudgetSummaryCard({
  fundStatus,
  isAdmin,
  onAdjust,
}: {
  fundStatus: FundStatus
  isAdmin: boolean
  onAdjust: (delta: number, name: string, reason: string) => Promise<ActionResult>
}) {
  const { balance, className, targetBudget } = fundStatus
  const pct = Math.min((balance / targetBudget) * 100, 100)
  const isLow = pct < 50
  const isComplete = pct >= 100

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      {isAdmin && <AdjustBalanceForm onAdjust={onAdjust} />}
    </div>
  )
}

function ReportPaymentForm({
  suggestedAmount,
  defaultPayerName,
  onReport,
}: {
  suggestedAmount: number
  defaultPayerName: string
  onReport: (amount: number, payerName: string, reason: string) => Promise<ActionResult>
}) {
  const [amount, setAmount] = useState(suggestedAmount > 0 ? suggestedAmount.toLocaleString('vi-VN') : '')
  const [name, setName] = useState(defaultPayerName)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const value = parseMoneyInput(amount)
    if (!value || value <= 0 || !name.trim()) return
    startTransition(async () => {
      const result = await onReport(value, name.trim(), reason.trim())
      if (result.error) {
        setError(result.error)
        setSuccess(false)
        return
      }
      setError(null)
      setSuccess(true)
      setName('')
      setReason('')
    })
  }

  const inputClass = 'rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t border-surface-border pt-4">
      <p className="text-xs font-medium text-ink-muted">Đã chuyển khoản? Báo cho lớp biết</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <MoneyInput
          value={amount}
          onChange={setAmount}
          placeholder="Số tiền (VNĐ)"
          className={`flex-1 font-jetbrains ${inputClass}`}
        />
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tên của bạn"
          className={`flex-1 ${inputClass}`}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Lý do (không bắt buộc)"
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="submit"
          disabled={!amount || !name.trim() || isPending}
          className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5"
        >
          {isPending ? '...' : 'Tôi đã chuyển'}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-neon-red">{error}</p>}
      {success && <p className="text-xs font-medium text-neon-green">Đã ghi nhận, chờ admin xác nhận.</p>}
    </form>
  )
}

function MomoCard({
  amount,
  className,
  defaultPayerName,
  onReportPayment,
}: {
  amount: number
  className: string
  defaultPayerName: string
  onReportPayment: (amount: number, payerName: string, reason: string) => Promise<ActionResult>
}) {
  const [copied, setCopied] = useState(false)
  const accountNumber = '0886662905'
  const bankName = 'Momo'

  function handleCopy() {
    navigator.clipboard.writeText(accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Thu tiền qua Momo</h3>

      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="flex-shrink-0">
          <div className="flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-surface-elevated">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/momo-qr.jpg"
              alt="Mã QR Momo"
              width={256}
              height={256}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-1.5 text-center text-[10px] text-ink-muted">QR</p>
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
      <ReportPaymentForm suggestedAmount={amount} defaultPayerName={defaultPayerName} onReport={onReportPayment} />
    </div>
  )
}

const DONOR_RANK_COLORS = ['text-neon-yellow', 'text-ink-secondary', 'text-brand-light']

function TopDonorsCard({ donors }: { donors: TopDonor[] }) {
  if (donors.length === 0) return null

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Top 3 người ủng hộ</h3>
      <ol className="space-y-2.5">
        {donors.map((donor, index) => (
          <li
            key={donor.payerName}
            className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-elevated px-4 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className={`font-orbitron text-lg font-bold ${DONOR_RANK_COLORS[index] ?? 'text-ink-muted'}`}>
                #{index + 1}
              </span>
              <span className="font-medium text-ink-primary">{donor.payerName}</span>
            </div>
            <span className="font-jetbrains font-semibold text-accent">{formatVND(donor.total)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-neon-green/10 px-2.5 py-1 text-xs font-semibold text-neon-green">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-green" />
        Đã duyệt
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-neon-red/10 px-2.5 py-1 text-xs font-semibold text-neon-red">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-red" />
        Từ chối
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-neon-yellow/10 px-2.5 py-1 text-xs font-semibold text-neon-yellow">
      <span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-neon-yellow opacity-75" />
      <span className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-neon-yellow" />
      Chờ duyệt
    </span>
  )
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
]

export default function FundTable({
  fundStatus,
  transactions,
  topDonors,
  defaultPayerName,
  isAdmin,
  onApprove,
  onReject,
  onAdjustBalance,
  onReportPayment,
}: FundTableProps) {
  const [isPending, startTransition] = useTransition()
  const [actingId, setActingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  function handleApprove(id: string) {
    setActingId(id)
    setActionError(null)
    startTransition(async () => {
      const result = await onApprove(id)
      if (result.error) setActionError(result.error)
      setActingId(null)
    })
  }

  function handleReject(id: string) {
    setActingId(id)
    setActionError(null)
    startTransition(async () => {
      const result = await onReject(id)
      if (result.error) setActionError(result.error)
      setActingId(null)
    })
  }

  const suggestedAmount = Math.round(
    (fundStatus.targetBudget - fundStatus.balance) / Math.max(transactions.filter(t => t.status === 'pending').length, 1)
  )

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return transactions.filter(tx => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false
      if (query && !tx.payerName.toLowerCase().includes(query)) return false
      return true
    })
  }, [transactions, statusFilter, search])

  const totalPages = Math.max(Math.ceil(filteredTransactions.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, totalPages)
  const pagedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-orbitron text-2xl font-bold text-ink-primary">Quản lý quỹ lớp</h1>
          <p className="mt-1 text-sm text-ink-secondary">Theo dõi thu chi và duyệt thanh toán</p>
        </div>

        <BudgetSummaryCard fundStatus={fundStatus} isAdmin={isAdmin} onAdjust={onAdjustBalance} />

        <TopDonorsCard donors={topDonors} />

        <MomoCard
          amount={suggestedAmount}
          className={fundStatus.className}
          defaultPayerName={defaultPayerName}
          onReportPayment={onReportPayment}
        />

        <div className="rounded-xl border border-surface-border bg-surface-card shadow-card">
          <div className="border-b border-surface-border px-4 py-4 sm:px-6">
            <h3 className="text-base font-semibold text-ink-primary">Giao dịch gần đây</h3>
            {actionError && <p className="mt-1 text-xs font-medium text-neon-red">{actionError}</p>}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex overflow-hidden rounded-lg border border-surface-border">
                {STATUS_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleStatusFilterChange(filter.value)}
                    className={`flex-1 px-3 py-1.5 text-xs font-semibold transition sm:flex-none ${
                      statusFilter === filter.value
                        ? 'bg-brand/10 text-brand-light'
                        : 'text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Tìm theo tên người nộp..."
                className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-elevated text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 sm:px-6">#</th>
                  <th className="px-4 py-3 sm:px-6">Người nộp</th>
                  <th className="px-4 py-3 sm:px-6">Lý do</th>
                  <th className="px-4 py-3 sm:px-6">Số tiền</th>
                  <th className="px-4 py-3 sm:px-6">Thời gian</th>
                  <th className="px-4 py-3 sm:px-6">Trạng thái</th>
                  <th className="px-4 py-3 sm:px-6">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {pagedTransactions.map((tx, index) => (
                  <tr key={tx.id} className="transition-colors hover:bg-surface-elevated">
                    <td className="px-4 py-4 font-jetbrains text-ink-muted sm:px-6">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-4 font-medium text-ink-primary sm:px-6">{tx.payerName}</td>
                    <td className="px-4 py-4 text-ink-secondary sm:px-6">{tx.note ?? <span className="text-ink-muted">—</span>}</td>
                    <td
                      className={`px-4 py-4 font-jetbrains font-semibold sm:px-6 ${
                        tx.amount < 0 ? 'text-neon-red' : 'text-ink-primary'
                      }`}
                    >
                      {formatVND(tx.amount)}
                    </td>
                    <td className="px-4 py-4 font-jetbrains text-xs text-ink-muted sm:px-6">{formatDateTime(tx.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      {tx.status === 'pending' && isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(tx.id)}
                            disabled={isPending && actingId === tx.id}
                            className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isPending && actingId === tx.id ? 'Đang duyệt...' : 'Duyệt'}
                          </button>
                          <button
                            onClick={() => handleReject(tx.id)}
                            disabled={isPending && actingId === tx.id}
                            className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-neon-red transition hover:border-neon-red hover:bg-neon-red/10 focus:outline-none focus:ring-2 focus:ring-neon-red focus:ring-offset-2 focus:ring-offset-surface-base disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isPending && actingId === tx.id ? 'Đang xử lý...' : 'Từ chối'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {pagedTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ink-muted sm:px-6">
                      Không có giao dịch nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-surface-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-ink-muted">
              {filteredTransactions.length === 0
                ? '0 giao dịch'
                : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)} / ${filteredTransactions.length} giao dịch`}
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-ink-secondary transition hover:border-brand hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5"
              >
                ‹ Trước
              </button>
              <p className="font-jetbrains text-xs text-ink-muted">
                Trang {currentPage}/{totalPages}
              </p>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-ink-secondary transition hover:border-brand hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5"
              >
                Sau ›
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}
