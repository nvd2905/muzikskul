import type { AnalyticsSummary } from '../types'

type AnalyticsSectionProps = {
  analytics: AnalyticsSummary
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function monthDisplay(month: string) {
  const [year, monthNum] = month.split('-')
  return `Tháng ${monthNum}/${year}`
}

function ChangeBadge({ percentage }: { percentage: number | null }) {
  if (percentage === null) return <span className="font-jetbrains text-xs text-ink-muted">—</span>

  const isUp = percentage >= 0
  return (
    <span
      className={`inline-flex items-center gap-1 font-jetbrains text-xs font-semibold ${
        isUp ? 'text-neon-green' : 'text-neon-red'
      }`}
    >
      {isUp ? '▲' : '▼'} {Math.abs(percentage).toFixed(1)}%
    </span>
  )
}

function Bar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const heightPercentage = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="flex h-32 w-full items-end justify-center">
        <div
          className={`w-8 rounded-t-md transition-all duration-700 sm:w-10 ${colorClass}`}
          style={{ height: `${heightPercentage}%` }}
        />
      </div>
      <p className="font-jetbrains text-xs text-ink-muted">{formatVND(value)}</p>
      <p className="text-xs text-ink-secondary">{label}</p>
    </div>
  )
}

export default function AnalyticsSection({ analytics }: AnalyticsSectionProps) {
  const { current, previous, incomeChangePercentage, expenseChangePercentage } = analytics
  const max = Math.max(current.income, current.expense, previous.income, previous.expense, 1)

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-primary">Thu chi theo tháng</h3>
        <p className="text-xs text-ink-muted">
          {monthDisplay(previous.month)} → {monthDisplay(current.month)}
        </p>
      </div>

      <div className="flex items-end justify-around gap-2 border-b border-surface-border pb-4">
        <Bar label={`Thu · ${monthDisplay(previous.month)}`} value={previous.income} max={max} colorClass="bg-neon-green/40" />
        <Bar label={`Thu · ${monthDisplay(current.month)}`} value={current.income} max={max} colorClass="bg-neon-green" />
        <Bar label={`Chi · ${monthDisplay(previous.month)}`} value={previous.expense} max={max} colorClass="bg-neon-red/40" />
        <Bar label={`Chi · ${monthDisplay(current.month)}`} value={current.expense} max={max} colorClass="bg-neon-red" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-ink-muted">Thu nhập so với tháng trước</p>
          <div className="mt-1">
            <ChangeBadge percentage={incomeChangePercentage} />
          </div>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Chi tiêu so với tháng trước</p>
          <div className="mt-1">
            <ChangeBadge percentage={expenseChangePercentage} />
          </div>
        </div>
      </div>
    </div>
  )
}
