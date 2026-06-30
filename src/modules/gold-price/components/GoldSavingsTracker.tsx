'use client'

import { useState, useEffect } from 'react'
import type { GoldPrice } from '../services'

const STORAGE_KEY = 'muzikskul:gold-savings'

type GoldPurchase = {
  id: string
  date: string
  goldCode: string
  chi: number
  pricePerChi: number
}

type SavedData = {
  target: number
  purchases: GoldPurchase[]
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatPriceInput(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('vi-VN')
}

function parsePriceInput(formatted: string) {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0
}

export default function GoldSavingsTracker({ prices }: { prices: GoldPrice[] }) {
  const [data, setData] = useState<SavedData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('')
  // add form
  const [newDate, setNewDate] = useState('')
  const [newGoldCode, setNewGoldCode] = useState('SJC')
  const [newChi, setNewChi] = useState('')
  const [newPrice, setNewPrice] = useState('')
  // inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editGoldCode, setEditGoldCode] = useState('SJC')
  const [editChi, setEditChi] = useState('')
  const [editPrice, setEditPrice] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setData(raw ? JSON.parse(raw) : { target: 0, purchases: [] })
    } catch {
      setData({ target: 0, purchases: [] })
    }
  }, [])

  useEffect(() => {
    if (data !== null) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  if (data === null) return null

  const { target, purchases } = data

  function getPriceFor(code: string): number {
    return prices.find(p => p.code === code)?.sellingPrice ?? 0
  }

  const sjcPrice = getPriceFor('SJC')
  const selectedAddPrice = getPriceFor(newGoldCode)

  // Stats — per-purchase current value using each row's own gold code
  const totalChi = purchases.reduce((s, p) => s + p.chi, 0)
  const totalCost = purchases.reduce((s, p) => s + p.chi * p.pricePerChi, 0)
  const currentValue = purchases.reduce((s, p) => {
    const cp = getPriceFor(p.goldCode ?? 'SJC')
    return s + (cp > 0 ? p.chi * cp : p.chi * p.pricePerChi)
  }, 0)
  const hasLivePrice = prices.length > 0
  const pnl = hasLivePrice ? currentValue - totalCost : null
  const pnlPct = totalCost > 0 && pnl !== null ? (pnl / totalCost) * 100 : null
  const progress = target > 0 ? Math.min((totalChi / target) * 100, 100) : 0

  function openForm() {
    setNewDate(new Date().toISOString().split('T')[0])
    setNewGoldCode('SJC')
    setNewPrice(sjcPrice > 0 ? sjcPrice.toLocaleString('vi-VN') : '')
    setNewChi('')
    setShowForm(true)
  }

  function selectGoldCode(code: string) {
    setNewGoldCode(code)
    const p = getPriceFor(code)
    if (p > 0) setNewPrice(p.toLocaleString('vi-VN'))
  }

  function selectEditGoldCode(code: string) {
    setEditGoldCode(code)
    const p = getPriceFor(code)
    if (p > 0) setEditPrice(p.toLocaleString('vi-VN'))
  }

  function addPurchase() {
    const chiVal = Math.round(parseFloat(newChi) * 10) / 10
    const priceVal = parsePriceInput(newPrice)
    if (!newDate || !(chiVal > 0) || !(priceVal > 0)) return
    setData(prev => prev ? {
      ...prev,
      purchases: [{
        id: crypto.randomUUID(),
        date: newDate,
        goldCode: newGoldCode,
        chi: chiVal,
        pricePerChi: priceVal,
      }, ...prev.purchases],
    } : prev)
    setShowForm(false)
  }

  function deletePurchase(id: string) {
    setData(prev => prev ? { ...prev, purchases: prev.purchases.filter(p => p.id !== id) } : prev)
  }

  function startEdit(p: GoldPurchase) {
    setEditingId(p.id)
    setEditDate(p.date)
    setEditGoldCode(p.goldCode ?? 'SJC')
    setEditChi(String(p.chi))
    setEditPrice(p.pricePerChi.toLocaleString('vi-VN'))
    setShowForm(false)
  }

  function saveEdit() {
    if (!editingId) return
    const chiVal = Math.round(parseFloat(editChi) * 10) / 10
    const priceVal = parsePriceInput(editPrice)
    if (!editDate || !(chiVal > 0) || !(priceVal > 0)) return
    setData(prev => prev ? {
      ...prev,
      purchases: prev.purchases.map(p =>
        p.id === editingId
          ? { ...p, date: editDate, goldCode: editGoldCode, chi: chiVal, pricePerChi: priceVal }
          : p
      ),
    } : prev)
    setEditingId(null)
  }

  function saveTarget() {
    const val = parseFloat(targetInput)
    if (val > 0) setData(prev => prev ? { ...prev, target: val } : prev)
    setEditTarget(false)
  }

  const inputCls = 'rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'


  const stats = [
    { label: 'Tổng chỉ tích lũy', value: `${totalChi.toFixed(2)} chỉ`, cls: 'text-ink-primary' },
    { label: 'Tổng vốn bỏ ra', value: formatVND(totalCost), cls: 'text-ink-primary' },
    { label: 'Giá trị hiện tại', value: hasLivePrice ? formatVND(currentValue) : '—', cls: 'text-accent' },
    {
      label: 'Lãi / Lỗ',
      value: pnl !== null ? `${pnl >= 0 ? '+' : ''}${formatVND(pnl)}` : '—',
      sub: pnlPct !== null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%` : undefined,
      cls: pnl !== null ? (pnl >= 0 ? 'text-neon-green' : 'text-neon-red') : 'text-ink-muted',
    },
  ]

  // Gold type chips shared between add & edit
  function GoldCodeChips({ selected, onSelect }: { selected: string; onSelect: (code: string) => void }) {
    return (
      <div className="flex flex-wrap gap-1">
        {prices.map(p => (
          <button
            key={p.code}
            type="button"
            onClick={() => onSelect(p.code)}
            className={`rounded px-2 py-0.5 font-jetbrains text-xs font-semibold transition ${
              selected === p.code
                ? 'bg-brand text-ink-primary shadow-brand-glow'
                : 'bg-surface-elevated text-ink-muted hover:text-ink-primary'
            }`}
          >
            {p.code}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-orbitron text-lg font-bold text-ink-primary">Tích chỉ cá nhân</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Lưu tại thiết bị này
            {sjcPrice > 0 && (
              <> · SJC bán: <span className="font-jetbrains text-accent">{formatVND(sjcPrice)}/chỉ</span></>
            )}
          </p>
        </div>
        {!showForm && (
          <button onClick={openForm} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:bg-brand-dark">
            + Thêm lần mua
          </button>
        )}
      </div>

      {/* Stats */}
      {purchases.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(item => (
            <div key={item.label} className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
              <p className="text-xs font-medium text-ink-muted">{item.label}</p>
              <p className={`mt-1 truncate font-jetbrains text-sm font-bold ${item.cls}`}>{item.value}</p>
              {item.sub && <p className={`font-jetbrains text-xs ${item.cls}`}>{item.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Target + progress */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-ink-muted">Mục tiêu tích lũy</p>
            {!editTarget ? (
              <>
                <span className="font-jetbrains font-bold text-ink-primary">
                  {target > 0 ? `${target} chỉ` : <span className="text-ink-muted">Chưa đặt</span>}
                </span>
                <button onClick={() => { setTargetInput(String(target || '')); setEditTarget(true) }}
                  className="text-xs text-ink-muted transition hover:text-brand-light">
                  {target > 0 ? 'Sửa' : '→ Đặt mục tiêu'}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input autoFocus type="number" min="0.1" step="0.1" value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') setEditTarget(false) }}
                  placeholder="Số chỉ"
                  className="w-24 rounded-lg border border-surface-border bg-surface-elevated px-2 py-1 font-jetbrains text-sm text-ink-primary focus:border-brand focus:outline-none"
                />
                <span className="text-sm text-ink-muted">chỉ</span>
                <button onClick={saveTarget} className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-ink-primary hover:bg-brand-dark">Lưu</button>
                <button onClick={() => setEditTarget(false)} className="text-xs text-ink-muted hover:text-ink-primary">Hủy</button>
              </div>
            )}
          </div>
          {target > 0 && (
            <span className="font-jetbrains text-sm text-ink-muted">{totalChi.toFixed(2)} / {target} chỉ</span>
          )}
        </div>
        {target > 0 ? (
          <>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? 'bg-neon-green' : progress >= 50 ? 'bg-brand' : 'bg-neon-yellow'}`}
                style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between font-jetbrains text-xs text-ink-muted">
              <span>{progress.toFixed(1)}%</span>
              {sjcPrice > 0 && (
                <span>Còn thiếu: {Math.max(0, target - totalChi).toFixed(2)} chỉ ≈ {formatVND(Math.max(0, target - totalChi) * sjcPrice)}</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-ink-muted">Đặt mục tiêu để theo dõi tiến độ tích lũy vàng của bạn.</p>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-brand/40 bg-surface-card p-5 shadow-card">
          <p className="mb-4 text-sm font-semibold text-ink-primary">Thêm lần mua vàng</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted">Ngày mua</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className={`w-36 ${inputCls}`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted">Loại vàng</label>
              <GoldCodeChips selected={newGoldCode} onSelect={selectGoldCode} />
              {selectedAddPrice > 0 && (
                <p className="font-jetbrains text-[10px] text-ink-muted">
                  Bán ra: <span className="text-accent">{formatVND(selectedAddPrice)}/chỉ</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted">Số chỉ</label>
              <input type="number" min="0.1" step="0.1" value={newChi}
                onChange={e => {
                  setNewChi(e.target.value)
                  if (selectedAddPrice > 0) setNewPrice(selectedAddPrice.toLocaleString('vi-VN'))
                }}
                placeholder="VD: 1.5"
                className={`w-28 font-jetbrains ${inputCls}`}
              />
              <div className="flex gap-1">
                {[0.5, 1, 2, 5].map(v => (
                  <button key={v} type="button"
                    onClick={() => {
                      setNewChi(String(v))
                      if (selectedAddPrice > 0) setNewPrice(selectedAddPrice.toLocaleString('vi-VN'))
                    }}
                    className={`rounded px-1.5 py-0.5 font-jetbrains text-[10px] transition ${
                      Number(newChi) === v ? 'bg-brand text-ink-primary' : 'bg-surface-elevated text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted">Giá mua / chỉ (VNĐ)</label>
              <input type="text" inputMode="numeric" value={newPrice}
                onChange={e => setNewPrice(formatPriceInput(e.target.value))}
                placeholder="14.350.000"
                className={`w-40 font-jetbrains ${inputCls}`}
              />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={addPurchase} disabled={!newDate || !newChi || !newPrice}
                className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
                Lưu
              </button>
              <button onClick={() => setShowForm(false)}
                className="rounded-lg border border-surface-border px-4 py-1.5 text-sm text-ink-muted transition hover:border-brand hover:text-brand-light">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit form — outside table to avoid horizontal scroll */}
      {editingId && (
        <div className="rounded-xl border border-accent/40 bg-surface-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-primary">Sửa lần mua vàng</p>
            <button onClick={() => setEditingId(null)} className="text-xs text-ink-muted transition hover:text-ink-primary">✕ Hủy</button>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted">Ngày mua</label>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                className={`w-36 ${inputCls}`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted">Loại vàng</label>
              <select value={editGoldCode} onChange={e => selectEditGoldCode(e.target.value)}
                className={`${inputCls} cursor-pointer`}>
                {prices.map(pr => (
                  <option key={pr.code} value={pr.code}>{pr.code}</option>
                ))}
              </select>
              {getPriceFor(editGoldCode) > 0 && (
                <p className="font-jetbrains text-[10px] text-ink-muted">
                  Bán ra: <span className="text-accent">{formatVND(getPriceFor(editGoldCode))}/chỉ</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted">Số chỉ</label>
              <input type="number" min="0.1" step="0.1" value={editChi}
                onChange={e => setEditChi(e.target.value)}
                className={`w-28 font-jetbrains ${inputCls}`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted">Giá mua / chỉ (VNĐ)</label>
              <input type="text" inputMode="numeric" value={editPrice}
                onChange={e => setEditPrice(formatPriceInput(e.target.value))}
                className={`w-40 font-jetbrains ${inputCls}`} />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={saveEdit} disabled={!editDate || !editChi || !editPrice}
                className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-ink-primary transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
                Lưu
              </button>
              <button onClick={() => setEditingId(null)}
                className="rounded-lg border border-surface-border px-4 py-1.5 text-sm text-ink-muted transition hover:border-brand hover:text-brand-light">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      {purchases.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-card shadow-card">
          <div className="border-b border-surface-border px-6 py-4">
            <h3 className="text-sm font-semibold text-ink-primary">Lịch sử mua vàng</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-elevated text-left font-semibold uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2.5">Ngày</th>
                <th className="px-3 py-2.5">Loại</th>
                <th className="px-3 py-2.5">Số chỉ</th>
                <th className="px-3 py-2.5">Giá mua/chỉ</th>
                <th className="px-3 py-2.5">Hiện tại</th>
                <th className="px-3 py-2.5">Lãi / Lỗ</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {purchases.map(p => {
                const code = p.goldCode ?? 'SJC'
                const cost = p.chi * p.pricePerChi
                const cp = getPriceFor(code)
                const val = cp > 0 ? p.chi * cp : null
                const gain = val !== null ? val - cost : null
                const gainPct = gain !== null && cost > 0 ? (gain / cost) * 100 : null
                const isActive = editingId === p.id

                return (
                  <tr key={p.id} className={`transition-colors ${isActive ? 'bg-accent/5 ring-1 ring-inset ring-accent/20' : 'hover:bg-surface-elevated'}`}>
                    <td className="px-3 py-3 font-jetbrains text-ink-muted">{formatDate(p.date)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-jetbrains font-semibold text-ink-secondary">{code}</span>
                    </td>
                    <td className="px-3 py-3 font-jetbrains font-semibold text-ink-primary">{p.chi} chỉ</td>
                    <td className="px-3 py-3 font-jetbrains text-ink-secondary">{formatVND(p.pricePerChi)}</td>
                    <td className="px-3 py-3 font-jetbrains text-accent">
                      {val !== null ? formatVND(val) : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {gain !== null ? (
                        <div className={`font-jetbrains font-semibold ${gain >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                          <span>{gain >= 0 ? '▲' : '▼'} {formatVND(Math.abs(gain))}</span>
                          {gainPct !== null && (
                            <div className="font-normal opacity-70">{gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%</div>
                          )}
                        </div>
                      ) : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => isActive ? setEditingId(null) : startEdit(p)}
                          className={`transition ${isActive ? 'text-accent' : 'text-ink-muted hover:text-brand-light'}`}
                          title={isActive ? 'Đóng' : 'Sửa'}
                        >
                          ✎
                        </button>
                        <button onClick={() => deletePurchase(p.id)} className="text-ink-muted transition hover:text-neon-red" title="Xóa">✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {purchases.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-surface-border bg-surface-card p-8 text-center">
          <p className="text-sm text-ink-muted">
            Chưa có lần mua nào.{' '}
            <button onClick={openForm} className="text-brand-light hover:underline">Thêm lần mua đầu tiên</button>
            {' '}để bắt đầu theo dõi.
          </p>
        </div>
      )}
    </div>
  )
}
