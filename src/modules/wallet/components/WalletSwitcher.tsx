'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessibleWallet } from '../types'

type WalletSwitcherProps = {
  wallets: AccessibleWallet[]
  selectedAccountId: string
}

export default function WalletSwitcher({ wallets, selectedAccountId }: WalletSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (wallets.length <= 1) return null

  return (
    <div className="flex flex-wrap gap-2">
      {wallets.map(wallet => {
        const isActive = wallet.account.id === selectedAccountId
        return (
          <button
            key={wallet.account.id}
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => router.push(`/my-wallet?wallet=${wallet.account.id}`))}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isActive
                ? 'border-brand-glow bg-brand/10 text-brand-light'
                : 'border-surface-border text-ink-secondary hover:border-brand hover:text-brand-light'
            }`}
          >
            {wallet.account.name}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                wallet.role === 'owner' ? 'bg-brand/20 text-brand-light' : 'bg-accent/20 text-accent-light'
              }`}
            >
              {wallet.role === 'owner' ? 'Chủ' : 'Thành viên'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
