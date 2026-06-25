'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/modules/auth/actions'
import LoginButton from '@/modules/auth/components/LoginButton'

export type NavUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
} | null

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/my-wallet', label: 'My Wallet' },
  { href: '/class-wallet', label: 'Class Wallet' },
]

export default function Navbar({ user }: { user: NavUser }) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#080B14]/80 px-8 backdrop-blur-[14px]">
      <Link
        href="/"
        className="text-[0.82rem] font-extrabold uppercase tracking-[0.13em] text-[#E8E8F0]"
      >
        Muzik<span className="text-indigo-500">skul</span>
      </Link>

      <ul className="hidden items-center gap-0.5 sm:flex">
        {LINKS.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={`rounded-lg px-3 py-1.5 text-[0.83rem] font-medium transition-colors ${
                  active
                    ? 'bg-indigo-500/[0.14] text-[#E8E8F0]'
                    : 'text-[#6B7280] hover:bg-white/5 hover:text-[#E8E8F0]'
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
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
                </span>
              )}
              <span className="hidden text-sm font-medium text-[#E8E8F0]/80 sm:block">
                {user.name ?? user.email}
              </span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-[0.83rem] text-[#6B7280] transition hover:bg-white/5 hover:text-[#E8E8F0]"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <LoginButton />
        )}
      </div>
    </nav>
  )
}
