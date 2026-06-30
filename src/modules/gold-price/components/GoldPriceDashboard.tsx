'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { GoldPrice, GoldPricePoint } from '../services'
import GoldSavingsTracker from './GoldSavingsTracker'

type NavUser = { id: string; name: string | null; email: string | null; avatarUrl: string | null } | null

type Props = {
  prices: GoldPrice[]
  history: GoldPricePoint[]
  user: NavUser
  onSignIn: () => Promise<void>
}

const GOLD_LABELS: Record<string, string> = {
  SJC: 'Vàng SJC',
  '999': 'Vàng 999',
  '9999': 'Vàng 9999',
  PNJ: 'PNJ Gold',
  DOJI: 'DOJI Gold',
  BTMC: 'Bảo Tín Minh Châu',
  DOHOANH: 'Đỗ Hoành',
}

function formatVND(n: number) {
  if (n === 0) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatM(n: number) {
  return `${(n / 1_000_000).toFixed(2)}M`
}

function parseDateTime(str: string): number {
  const [datePart, timePart] = str.split(' ')
  const [day, month, year] = datePart.split('/')
  const [h, m] = timePart.split(':')
  return Date.UTC(+year, +month - 1, +day, +h, +m)
}

function ChangeCell({ change, pct }: { change: number; pct: number }) {
  if (change === 0) {
    return <span className="font-jetbrains text-xs text-ink-muted">—</span>
  }
  const positive = change > 0
  return (
    <span className={`inline-flex items-center gap-0.5 font-jetbrains text-xs font-semibold ${positive ? 'text-neon-green' : 'text-neon-red'}`}>
      {positive ? '▲' : '▼'}
      {Math.abs(change).toLocaleString('vi-VN')}
      <span className="font-normal text-ink-muted">({pct > 0 ? '+' : ''}{pct.toFixed(2)}%)</span>
    </span>
  )
}

function SJCHero({ price }: { price: GoldPrice }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Vàng SJC</p>
          <p className="mt-0.5 text-xs text-ink-muted">Cập nhật: {price.dateTime}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-neon-green/10 px-3 py-1 text-xs font-semibold text-neon-green">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-green opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-green" />
          </span>
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-xs font-medium text-ink-muted">Mua vào</p>
          <p className="font-jetbrains text-2xl font-bold text-accent sm:text-3xl">
            {formatVND(price.buyingPrice)}
          </p>
          <div className="mt-1.5">
            <ChangeCell change={price.buyChange} pct={price.buyChangePercent} />
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-ink-muted">Bán ra</p>
          <p className="font-jetbrains text-2xl font-bold text-brand-light sm:text-3xl">
            {formatVND(price.sellingPrice)}
          </p>
          <div className="mt-1.5">
            <ChangeCell change={price.sellChange} pct={price.sellChangePercent} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SJCSparkline({ data }: { data: GoldPricePoint[] }) {
  if (data.length < 2) return (
    <p className="py-8 text-center text-sm text-ink-muted">Không có dữ liệu lịch sử</p>
  )

  const sorted = [...data].sort((a, b) => parseDateTime(a.dateTime) - parseDateTime(b.dateTime))

  const allPrices = sorted.flatMap(p => [p.buyingPrice, p.sellingPrice]).filter(v => v > 0)
  const minP = Math.min(...allPrices)
  const maxP = Math.max(...allPrices)
  const rangePad = (maxP - minP) * 0.15 || 500000
  const lo = minP - rangePad
  const hi = maxP + rangePad
  const priceRange = hi - lo

  const W = 600
  const H = 180
  const PAD = { top: 20, right: 16, bottom: 32, left: 72 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom
  const bottomY = PAD.top + cH

  const xOf = (i: number) => PAD.left + (i / (sorted.length - 1)) * cW
  const yOf = (price: number) => PAD.top + cH - ((price - lo) / priceRange) * cH

  const buyPts = sorted.map((p, i) => ({ x: xOf(i), y: yOf(p.buyingPrice) }))
  const sellPts = sorted.map((p, i) => ({ x: xOf(i), y: yOf(p.sellingPrice) }))

  function bezierPath(pts: { x: number; y: number }[]) {
    let d = `M ${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2
      d += ` C ${cpx},${pts[i - 1].y} ${cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`
    }
    return d
  }

  function areaPath(pts: { x: number; y: number }[]) {
    return `${bezierPath(pts)} L ${pts[pts.length - 1].x},${bottomY} L ${pts[0].x},${bottomY} Z`
  }

  const gridPrices = [0, 0.25, 0.5, 0.75, 1].map(t => lo + t * priceRange)
  const step = Math.max(1, Math.floor(sorted.length / 5))
  const lastBuy = buyPts[buyPts.length - 1]
  const lastSell = sellPts[sellPts.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="buyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sellGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {gridPrices.map((price, i) => {
        const y = yOf(price)
        if (y < PAD.top - 4 || y > bottomY + 4) return null
        return (
          <g key={i}>
            <line
              x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="#252538" strokeWidth="1" strokeDasharray="3 5"
            />
            <text x={PAD.left - 6} y={y + 3.5} textAnchor="end" fontSize="9" fill="#52525b">
              {formatM(price)}
            </text>
          </g>
        )
      })}

      {/* Fill areas */}
      <path d={areaPath(buyPts)} fill="url(#buyGrad)" />
      <path d={areaPath(sellPts)} fill="url(#sellGrad)" />

      {/* Lines */}
      <path d={bezierPath(buyPts)} fill="none" stroke="#06b6d4" strokeWidth="1.75" strokeLinecap="round" />
      <path d={bezierPath(sellPts)} fill="none" stroke="#7c3aed" strokeWidth="1.75" strokeLinecap="round" />

      {/* Latest-point dots */}
      <circle cx={lastBuy.x} cy={lastBuy.y} r="3.5" fill="#06b6d4" opacity="0.9" />
      <circle cx={lastBuy.x} cy={lastBuy.y} r="6" fill="#06b6d4" opacity="0.15" />
      <circle cx={lastSell.x} cy={lastSell.y} r="3.5" fill="#7c3aed" opacity="0.9" />
      <circle cx={lastSell.x} cy={lastSell.y} r="6" fill="#7c3aed" opacity="0.15" />

      {/* Time labels */}
      {sorted.map((p, i) => {
        if (i % step !== 0 && i !== sorted.length - 1) return null
        return (
          <text key={i} x={xOf(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#52525b">
            {p.dateTime.split(' ')[1]}
          </text>
        )
      })}
    </svg>
  )
}

function AllPricesTable({ prices }: { prices: GoldPrice[] }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card shadow-card">
      <div className="border-b border-surface-border px-6 py-4">
        <h3 className="text-base font-semibold text-ink-primary">Bảng giá trong nước</h3>
        <p className="mt-0.5 text-xs text-ink-muted">Đơn vị: VNĐ / chỉ (3,75g)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-6 py-3">Loại vàng</th>
              <th className="px-6 py-3">Mua vào</th>
              <th className="px-6 py-3">Bán ra</th>
              <th className="px-6 py-3">Thay đổi (bán)</th>
              <th className="px-6 py-3 text-right">Cập nhật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {prices.map(p => (
              <tr key={p.code} className="transition-colors hover:bg-surface-elevated">
                <td className="px-6 py-4">
                  <span className="font-semibold text-ink-primary">
                    {GOLD_LABELS[p.code] ?? p.code}
                  </span>
                  {!GOLD_LABELS[p.code] && (
                    <span className="ml-1.5 rounded bg-surface-elevated px-1.5 py-0.5 font-jetbrains text-[10px] text-ink-muted">
                      {p.code}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-jetbrains font-semibold text-accent">
                  {formatVND(p.buyingPrice)}
                </td>
                <td className="px-6 py-4 font-jetbrains font-semibold text-brand-light">
                  {formatVND(p.sellingPrice)}
                </td>
                <td className="px-6 py-4">
                  <ChangeCell change={p.sellChange} pct={p.sellChangePercent} />
                </td>
                <td className="px-6 py-4 text-right font-jetbrains text-xs text-ink-muted">
                  {p.dateTime.split(' ')[1]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.014.043.031.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

export default function GoldPriceDashboard({ prices, history, user, onSignIn }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showTracker, setShowTracker] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const sjc = prices.find(p => p.code === 'SJC') ?? prices[0]

  function handleRefresh() {
    startTransition(() => { router.refresh() })
  }

  function handleOpenTracker() {
    if (user) {
      setShowTracker(true)
    } else {
      setShowLoginModal(true)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-ink-primary">Giá vàng trong nước</h1>
          <p className="mt-1 text-sm text-ink-secondary">Dữ liệu từ mihong.vn — tự động làm mới mỗi 60 giây</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-secondary transition hover:border-brand hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Đang tải...' : '↻ Làm mới'}
        </button>
      </div>

      {/* Tích chỉ entry */}
      {!showTracker ? (
        <div className="rounded-xl border border-brand/30 bg-surface-card p-6 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-orbitron text-lg font-bold text-ink-primary">Tích chỉ cá nhân</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Theo dõi lịch sử mua vàng và tính lãi / lỗ theo giá realtime
              </p>
            </div>
            <button
              onClick={handleOpenTracker}
              className="shrink-0 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-ink-primary shadow-brand-glow transition hover:bg-brand-dark active:scale-95"
            >
              {user ? 'Mở tracker →' : 'Đăng nhập để dùng'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <button
            onClick={() => setShowTracker(false)}
            className="text-xs text-ink-muted transition hover:text-ink-primary"
          >
            ← Ẩn tích chỉ
          </button>
          <GoldSavingsTracker prices={prices} />
        </div>
      )}

      {sjc && <SJCHero price={sjc} />}

      <AllPricesTable prices={prices} />

      <div className="rounded-xl border border-surface-border bg-surface-card shadow-card">
        <div className="border-b border-surface-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink-primary">SJC — Biến động 24h</h3>
            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-5 rounded bg-accent" /> Mua vào
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-5 rounded bg-brand" /> Bán ra
              </span>
            </div>
          </div>
        </div>
        <div className="px-4 py-4">
          <SJCSparkline data={history} />
        </div>
      </div>

      {/* Discord login modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="relative mx-4 w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-8 shadow-card"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-elevated hover:text-ink-primary"
              aria-label="Đóng"
            >
              ✕
            </button>

            <div className="mb-8 text-center">
              <p className="font-orbitron text-2xl font-bold text-ink-primary">Muzikskul</p>
              <p className="mt-2 text-sm text-ink-secondary">Đăng nhập để dùng Tích chỉ cá nhân</p>
            </div>

            <form action={onSignIn}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-ink-primary shadow-brand-glow transition-all duration-150 hover:bg-brand-dark active:scale-95"
              >
                <DiscordIcon />
                Login with Discord
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-ink-muted">
              Sau khi đăng nhập bạn sẽ được quay về trang này
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
