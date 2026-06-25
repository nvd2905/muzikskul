'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/modules/auth/actions'
import LoginButton from '@/modules/auth/components/LoginButton'

export type NavLink = { href: string; label: string }

export type NavUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
} | null

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/my-wallet', label: 'My Wallet' },
  { href: '/class-wallet', label: 'Class Wallet' },
]

type NavbarProps = {
  user: NavUser
  links?: NavLink[]
}

export default function Navbar({ user, links = NAV_LINKS }: NavbarProps) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#0A0E1A]/80 px-6 backdrop-blur-[14px] lg:px-8">
      <Link
        href="/"
        className="font-orbitron text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E8E8F0]"
      >
        Muzik<span className="text-cyan-400">skul</span>
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
                    ? 'bg-cyan-500/[0.12] text-cyan-300'
                    : 'text-[#6B7280] hover:bg-white/[0.05] hover:text-[#E8E8F0]'
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
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-cyan-500/30"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
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
                className="cursor-pointer rounded-lg px-3 py-1.5 text-[0.83rem] text-[#6B7280] transition-colors duration-150 hover:bg-white/[0.05] hover:text-[#E8E8F0]"
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
