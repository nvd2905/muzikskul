'use client'

import { useState, useTransition } from 'react'
import type { SharePermission, WalletMember } from '../types'

type ActionResult = { error?: string }

type ShareWalletPanelProps = {
  members: WalletMember[]
  currentUserId: string
  isOwner: boolean
  onShareWallet: (email: string, permission: SharePermission) => Promise<ActionResult>
  onRevokeShare: (userId: string) => Promise<ActionResult>
}

const ROLE_LABELS: Record<WalletMember['role'], string> = {
  owner: 'Chủ sở hữu',
  partner: 'Thành viên',
}

const PERMISSION_LABELS: Record<SharePermission, string> = {
  view: 'Chỉ xem',
  edit: 'Toàn quyền',
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.trim().slice(0, 2).toUpperCase()
}

function MemberRow({
  member,
  isOwner,
  onRevoke,
}: {
  member: WalletMember
  isOwner: boolean
  onRevoke: (() => void) | null
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-xs font-bold text-ink-primary">
          {initials(member.username)}
        </span>
        <div>
          <p className="text-sm font-medium text-ink-primary">{member.username ?? 'Không rõ tên'}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                member.role === 'owner' ? 'bg-brand/10 text-brand-light' : 'bg-accent/10 text-accent-light'
              }`}
            >
              {ROLE_LABELS[member.role]}
            </span>
            {member.permission && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  member.permission === 'edit' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-yellow/10 text-neon-yellow'
                }`}
              >
                {PERMISSION_LABELS[member.permission]}
              </span>
            )}
          </div>
        </div>
      </div>
      {isOwner && onRevoke && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(onRevoke)}
          className="text-xs font-medium text-neon-red hover:text-neon-red/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? '...' : 'Thu hồi'}
        </button>
      )}
    </div>
  )
}

export default function ShareWalletPanel({
  members,
  currentUserId,
  isOwner,
  onShareWallet,
  onRevokeShare,
}: ShareWalletPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<SharePermission>('view')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const inputClass =
    'rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand focus:outline-none'

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Vui lòng nhập email.')
      return
    }
    startTransition(async () => {
      const result = await onShareWallet(trimmed, permission)
      if (result.error) {
        setError(result.error)
        setSuccess(false)
        return
      }
      setError(null)
      setSuccess(true)
      setEmail('')
    })
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card sm:p-6">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center justify-between"
      >
        <h3 className="text-base font-semibold text-ink-primary">Chia sẻ ví</h3>
        <span className="text-xs font-medium text-brand-light">{isOpen ? 'Thu gọn' : 'Mở rộng'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="divide-y divide-surface-border">
            {members.map(member => (
              <MemberRow
                key={member.userId}
                member={member}
                isOwner={isOwner}
                onRevoke={
                  isOwner && member.role === 'partner' && member.userId !== currentUserId
                    ? () => onRevokeShare(member.userId)
                    : null
                }
              />
            ))}
          </div>

          {isOwner && (
            <form onSubmit={handleSubmit} className="space-y-3 border-t border-surface-border pt-4">
              <p className="text-xs font-medium text-ink-muted">Mời vợ/chồng hoặc người thân cùng quản lý ví này</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email người được mời"
                  className={inputClass}
                />
                <select
                  value={permission}
                  onChange={e => setPermission(e.target.value as SharePermission)}
                  className={inputClass}
                >
                  <option value="view">Chỉ xem</option>
                  <option value="edit">Toàn quyền</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!email.trim() || isPending}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-ink-primary transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? 'Đang gửi lời mời...' : 'Gửi lời mời'}
              </button>
              {error && <p className="text-xs font-medium text-neon-red">{error}</p>}
              {success && <p className="text-xs font-medium text-neon-green">Đã thêm thành viên vào ví.</p>}
            </form>
          )}
        </div>
      )}
    </div>
  )
}
