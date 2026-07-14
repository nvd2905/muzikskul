'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '@/modules/auth/actions'

export type NavLink = { href: string; label: string; newTab?: boolean }

export type NavUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
} | null

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/class-wallet', label: 'Class Wallet' },
  { href: '/gold-price', label: 'Giá vàng' },
  { href: '/muzik', label: 'Muzik', newTab: true },
  { href: '/my-wallet', label: 'My Wallet' },
]

type NavbarProps = {
  user: NavUser
  links?: NavLink[]
}

export default function Navbar({ user, links = NAV_LINKS }: NavbarProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-border bg-surface-card/80 backdrop-blur-[14px]">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-orbitron text-[0.75rem] font-bold uppercase tracking-[0.18em] text-ink-primary"
        >
          Muzik<span className="text-accent">skul</span>
        </Link>

        <ul className="hidden items-center gap-0.5 sm:flex">
          {links.map(({ href, label, newTab }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  target={newTab ? '_blank' : undefined}
                  rel={newTab ? 'noopener noreferrer' : undefined}
                  className={`rounded-lg px-3 py-1.5 text-[0.83rem] font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-accent/10 text-accent-light'
                      : 'text-ink-muted hover:bg-surface-elevated hover:text-ink-primary'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <UserStatus user={user} />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary sm:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-surface-border bg-surface-card px-4 pb-4 pt-2 shadow-card sm:hidden">
          <ul className="flex flex-col gap-0.5">
            {links.map(({ href, label, newTab }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    target={newTab ? '_blank' : undefined}
                    rel={newTab ? 'noopener noreferrer' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-accent/10 text-accent-light'
                        : 'text-ink-muted hover:bg-surface-elevated hover:text-ink-primary'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3">
            <UserStatus user={user} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  )
}

function UserStatus({ user, onNavigate }: { user: NavUser; onNavigate?: () => void }) {
  if (!user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="rounded-lg bg-brand px-3.5 py-1.5 text-[0.83rem] font-semibold text-ink-primary transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base"
      >
        Log in
      </Link>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name ?? 'avatar'}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-accent/30"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-ink-primary">
            {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
          </span>
        )}
        <span className="text-sm font-medium text-ink-secondary">{user.name ?? user.email}</span>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="cursor-pointer rounded-lg px-3 py-1.5 text-[0.83rem] text-ink-muted transition-colors duration-150 hover:bg-surface-elevated hover:text-ink-primary"
        >
          Sign out
        </button>
      </form>
    </>
  )
}
