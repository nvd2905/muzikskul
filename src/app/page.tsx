import Link from 'next/link'
import Navbar from '@/shared/components/Navbar'
import WaveformCanvas from '@/shared/components/WaveformCanvas'
import { getCurrentUser } from '@/modules/auth/actions'

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-[#080B14]">
      <Navbar user={user} />

      {/* ── HERO ── */}
      <section>
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-16 px-8 py-20 lg:min-h-[calc(100vh-56px)] lg:grid-cols-[1fr_400px]">

          {/* Text */}
          <div className="order-2 lg:order-1">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-indigo-500/15 px-3.5 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.09em] text-indigo-300">
                For students &amp; friend groups
              </span>
            </div>

            <h1 className="mb-6 text-[clamp(3rem,6vw,5.25rem)] font-black leading-[1.0] tracking-[-0.045em] text-[#E8E8F0]">
              <span className="block text-amber-400">Music.</span>
              <span className="block">Money.</span>
              <span className="block text-[0.6em] font-bold tracking-[-0.02em] text-[#4b5563]">
                Managed together.
              </span>
            </h1>

            <p className="mb-10 max-w-[460px] text-[1rem] leading-[1.75] text-[#6B7280]">
              Split class funds, collect VietQR payments, and listen to music —
              all in one place for you and your group.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/my-wallet"
                className="rounded-[0.65rem] bg-indigo-600 px-6 py-3 text-[0.88rem] font-semibold text-white shadow-[0_0_28px_rgba(99,102,241,0.28)] transition hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.45)] active:scale-[0.97]"
              >
                Go to My Wallet
              </Link>
              <Link
                href="/class-wallet"
                className="rounded-[0.65rem] border border-white/[0.07] bg-transparent px-6 py-3 text-[0.88rem] font-semibold text-[#6B7280] transition hover:border-white/[0.13] hover:bg-white/[0.03] hover:text-[#E8E8F0]"
              >
                Manage Class Fund →
              </Link>
            </div>
          </div>

          {/* Oscilloscope panel */}
          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-[1.25rem] border border-white/[0.07] bg-[#111827]">
              {/* title bar */}
              <div className="flex items-center gap-1.5 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
                <span className="ml-auto text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
                  Live Signal
                </span>
              </div>

              {/* canvas */}
              <div className="h-[190px] w-full bg-[#111827]">
                <WaveformCanvas />
              </div>

              {/* stats */}
              <div className="grid grid-cols-2 border-t border-white/[0.07]">
                <div className="border-r border-white/[0.07] px-4 py-3">
                  <p className="mb-0.5 text-[0.73rem] text-[#6B7280]">Class Fund</p>
                  <p className="text-[1.1rem] font-bold tracking-tight text-amber-400">₫1.2M</p>
                </div>
                <div className="px-4 py-3">
                  <p className="mb-0.5 text-[0.73rem] text-[#6B7280]">Listening now</p>
                  <p className="text-[1.1rem] font-bold tracking-tight text-indigo-300">3 rooms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-gray-50 px-8 py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-14 text-center">
            <p className="mb-3 text-[0.73rem] font-bold uppercase tracking-[0.13em] text-indigo-600">
              What you get
            </p>
            <h2 className="text-[clamp(1.7rem,3.5vw,2.6rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-gray-900">
              Everything your group needs,
              <br />
              nothing it doesn&apos;t.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.07] bg-[#080B14] px-8 py-12">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[0.82rem] font-extrabold uppercase tracking-[0.13em] text-[#E8E8F0]">
              Muzikskul
            </p>
            <p className="mt-1 text-[0.78rem] text-[#6B7280]">Music and money, together.</p>
          </div>

          <ul className="flex flex-wrap gap-6">
            {[
              { href: '/', label: 'Home' },
              { href: '/my-wallet', label: 'My Wallet' },
              { href: '/class-wallet', label: 'Class Wallet' },
              { href: '/login', label: 'Login' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-[0.82rem] text-[#6B7280] transition hover:text-[#E8E8F0]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-[0.73rem] text-[#374151]">© 2026 Muzikskul</p>
        </div>
      </footer>
    </div>
  )
}

const FEATURES: FeatureProps[] = [
  {
    emoji: '💸',
    stripe: '#6366f1',
    title: 'Personal Expense Tracker',
    desc: 'Log spending and see exactly where your money goes each month. No spreadsheets, no group chats asking "who owes what."',
  },
  {
    emoji: '🔔',
    stripe: '#f59e0b',
    title: 'Automated Fund Reminders',
    desc: 'Automatic Discord pings remind classmates to contribute before the deadline. No more awkward messages.',
  },
  {
    emoji: '📱',
    stripe: '#10b981',
    title: 'VietQR Payments',
    desc: 'One QR code, instant inter-bank transfer. Classmates scan and pay — the fund updates in real-time.',
  },
  {
    emoji: '🎵',
    stripe: '#8b5cf6',
    title: 'Social Listening Rooms',
    desc: 'Create shared rooms and stream music together. Study sessions, hangouts, group playlists — all synced.',
  },
]

interface FeatureProps {
  emoji: string
  stripe: string
  title: string
  desc: string
}

function FeatureCard({ emoji, stripe, title, desc }: FeatureProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.25rem] border border-gray-100 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ '--stripe': stripe } as React.CSSProperties}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-[1.25rem]"
        style={{ background: stripe }}
      />
      <div className="mb-4 text-[1.75rem]">{emoji}</div>
      <h3 className="mb-2 text-[1rem] font-bold tracking-[-0.01em] text-gray-900">{title}</h3>
      <p className="text-[0.87rem] leading-[1.65] text-gray-500">{desc}</p>
    </div>
  )
}
