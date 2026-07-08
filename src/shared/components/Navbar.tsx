'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/modules/auth/actions'

export type NavLink = { href: string; label: string }

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
  { href: '/muzik', label: 'Muzik' },
  { href: '/my-wallet', label: 'My Wallet' },
]

type NavbarProps = {
  user: NavUser
  links?: NavLink[]
}

export default function Navbar({ user, links = NAV_LINKS }: NavbarProps) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-surface-border bg-surface-card/80 px-6 backdrop-blur-[14px] lg:px-8">
      <Link
        href="/"
        className="font-orbitron text-[0.75rem] font-bold uppercase tracking-[0.18em] text-ink-primary"
      >
        Muzik<span className="text-accent">skul</span>
      </Link>

      <ul className="hidden items-center gap-0.5 sm:flex">
        {links.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
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

      <div className="flex shrink-0 items-center gap-2">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name ?? 'avatar'}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-accent/30"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-ink-primary">
                  {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
                </span>
              )}
              <span className="hidden text-sm font-medium text-ink-secondary sm:block">
                {user.name ?? user.email}
              </span>
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
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-brand px-3.5 py-1.5 text-[0.83rem] font-semibold text-ink-primary transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  )
}
