import Link from 'next/link'
import Navbar from '@/shared/components/Navbar'
import WaveformCanvas from '@/shared/components/WaveformCanvas'
import FeatureSuggestion from '@/shared/components/FeatureSuggestion'
import { getCurrentUser } from '@/modules/auth/actions'
import { signInWithDiscord } from '@/modules/auth/actions'

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0E1A] text-[#E8E8F0]">
      {/* Scanline overlay — purely decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[999]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.022) 3px, rgba(0,0,0,0.022) 4px)',
        }}
      />

      <Navbar user={user} />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Subtle grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
              linear-gradient(to right, rgba(6,182,212,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Ambient glow blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 15% 55%, rgba(6,182,212,0.07) 0%, transparent 65%), radial-gradient(ellipse 50% 55% at 85% 45%, rgba(129,140,248,0.06) 0%, transparent 65%)',
          }}
        />

        <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-16 px-6 py-20 lg:min-h-[calc(100vh-56px)] lg:grid-cols-[1fr_420px] lg:px-8">

          {/* Left: copy */}
          <div className="order-2 lg:order-1">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-3.5 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              <span className="font-jetbrains text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cyan-300">
                For students &amp; friend groups
              </span>
            </div>

            <h1 className="mb-6 font-orbitron text-[clamp(2rem,5vw,4rem)] font-black leading-[1.06] tracking-[-0.015em]">
              <span className="block text-[#E8E8F0]">The Ultimate</span>
              <span
                className="block text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 55%, #e879f9 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                Digital Hub
              </span>
              <span className="block text-[0.58em] font-bold tracking-[0.01em] text-[#374151]">
                for Your Inner Circle
              </span>
            </h1>

            <p className="mb-10 max-w-[490px] text-[0.97rem] leading-[1.8] text-[#6B7280]">
              Stream music, watch movies, split bills, manage class funds, and share
              stories—all in one shared space.
            </p>

            <div className="flex flex-wrap gap-3">
              <form action={signInWithDiscord}>
                <button
                  type="submit"
                  className="flex cursor-pointer items-center gap-2.5 rounded-[0.65rem] bg-cyan-500 px-6 py-3 text-[0.88rem] font-semibold text-[#0A0E1A] shadow-[0_0_24px_rgba(6,182,212,0.35)] transition-all duration-200 hover:bg-cyan-400 hover:shadow-[0_0_40px_rgba(6,182,212,0.55)] active:scale-[0.97]"
                >
                  <DiscordIcon />
                  Get Started with Discord
                </button>
              </form>
              <a
                href="#ecosystem"
                className="flex items-center rounded-[0.65rem] border border-white/[0.08] bg-transparent px-6 py-3 text-[0.88rem] font-semibold text-[#6B7280] transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-[#E8E8F0]"
              >
                Explore Features →
              </a>
            </div>
          </div>

          {/* Right: oscilloscope panel */}
          <div className="order-1 lg:order-2">
            <div
              className="overflow-hidden rounded-[1.25rem] border border-white/[0.07]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(10,14,26,1) 50%)',
                boxShadow:
                  '0 0 0 1px rgba(6,182,212,0.08), 0 0 50px rgba(6,182,212,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {/* Title bar */}
              <div className="flex items-center gap-1.5 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
                <span className="ml-auto font-jetbrains text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#6B7280]">
                  Live Signal
                </span>
              </div>
              {/* Canvas */}
              <div className="h-[190px] w-full bg-[#0A0E1A]">
                <WaveformCanvas />
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 border-t border-white/[0.07]">
                <div className="border-r border-white/[0.07] px-4 py-3">
                  <p className="mb-0.5 font-jetbrains text-[0.68rem] text-[#6B7280]">Class Fund</p>
                  <p
                    className="font-orbitron text-[1rem] font-bold"
                    style={{ color: '#fbbf24', textShadow: '0 0 14px rgba(251,191,36,0.5)' }}
                  >
                    ₫1.2M
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="mb-0.5 font-jetbrains text-[0.68rem] text-[#6B7280]">Listening now</p>
                  <p
                    className="font-orbitron text-[1rem] font-bold"
                    style={{ color: '#06b6d4', textShadow: '0 0 14px rgba(6,182,212,0.5)' }}
                  >
                    3 rooms
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM GRID ──────────────────────────────────────────── */}
      <section id="ecosystem" className="relative px-6 py-28 lg:px-8">
        <SectionDivider color="rgba(6,182,212,0.18)" />

        <div className="mx-auto max-w-[1100px]">
          <div className="mb-16 text-center">
            <p className="font-jetbrains mb-3 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-cyan-500">
              Core Features
            </p>
            <h2 className="font-orbitron text-[clamp(1.55rem,3.5vw,2.4rem)] font-black leading-[1.15] tracking-[-0.01em] text-[#E8E8F0]">
              One Space.
              <br />
              Every Service.
            </h2>
            <p className="mx-auto mt-4 max-w-[480px] text-[0.92rem] leading-[1.75] text-[#6B7280]">
              Three interconnected hubs built for the way your group actually lives—not
              how you wish you did.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <EcosystemCard
              color="#06b6d4"
              glowRgb="6,182,212"
              icon={<EntertainmentIcon />}
              tag="Entertainment Hub"
              title="Vibe Together"
              features={[
                'Stream music in synced rooms',
                'Watch movies simultaneously',
                'Group playlists & live radio',
                'Shared listening history',
              ]}
              href="/my-wallet"
            />
            <EcosystemCard
              color="#818cf8"
              glowRgb="129,140,248"
              icon={<FinanceIcon />}
              tag="Finance Hub"
              title="Money, Sorted"
              features={[
                'Class fund management',
                'VietQR instant payments',
                'Personal expense tracker',
                'Automated Discord reminders',
              ]}
              href="/class-wallet"
            />
            <EcosystemCard
              color="#e879f9"
              glowRgb="232,121,249"
              icon={<SocialIcon />}
              tag="Social Space"
              title="Stay Connected"
              features={[
                'Class blogs & announcements',
                'Anonymous confessions',
                'Community boards',
                'Event coordination',
              ]}
              href="/"
            />
          </div>
        </div>
      </section>

      {/* ── FUTURE LAB ──────────────────────────────────────────────── */}
      <section className="relative px-6 py-28 lg:px-8">
        <SectionDivider color="rgba(232,121,249,0.18)" />
        {/* Ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 50% at 50% 50%, rgba(129,140,248,0.04) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-[1100px]">
          <div className="mb-16 text-center">
            <p className="font-jetbrains mb-3 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-violet-400">
              Future Lab
            </p>
            <h2 className="font-orbitron text-[clamp(1.55rem,3.5vw,2.4rem)] font-black leading-[1.15] tracking-[-0.01em] text-[#E8E8F0]">
              The Evolution
              <br />
              Never Stops
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-[0.92rem] leading-[1.75] text-[#6B7280]">
              We are constantly building new tools for your squad. Have an idea? Suggest
              it below.
            </p>
          </div>

          {/* Placeholder cards */}
          <div className="mb-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <FutureCard hint="Feature Loading..." delay="0s" />
            <FutureCard hint="Coming Soon..." delay="0.15s" />
            <FutureCard hint="In Development" delay="0.3s" />
          </div>

          {/* Suggestion input */}
          <FeatureSuggestion />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#080B14] px-6 py-12 lg:px-8">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-6">
          <div>
            <p className="font-orbitron text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#E8E8F0]">
              Muzik<span className="text-cyan-400">skul</span>
            </p>
            <p className="mt-1 font-jetbrains text-[0.73rem] text-[#374151]">
              Music. Money. Community.
            </p>
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
                  className="text-[0.82rem] text-[#6B7280] transition-colors duration-150 hover:text-[#E8E8F0]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="font-jetbrains text-[0.7rem] text-[#374151]">© 2026 Muzikskul</p>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionDivider({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-px"
      style={{
        background: `linear-gradient(to right, transparent, ${color}, transparent)`,
      }}
    />
  )
}

type EcosystemCardProps = {
  color: string
  glowRgb: string
  icon: React.ReactNode
  tag: string
  title: string
  features: string[]
  href: string
}

function EcosystemCard({ color, glowRgb, icon, tag, title, features, href }: EcosystemCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-[1.25rem] border border-white/[0.07] p-7 transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: `linear-gradient(135deg, rgba(${glowRgb},0.06) 0%, rgba(10,14,26,0.95) 55%)`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      {/* Top line accent */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-[1.25rem]"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${color} 40%, transparent 100%)`,
        }}
      />
      {/* Corner ambient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ background: color }}
      />

      {/* Icon */}
      <div
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07]"
        style={{
          color,
          background: `rgba(${glowRgb},0.1)`,
        }}
      >
        {icon}
      </div>

      {/* Tag */}
      <p
        className="font-jetbrains mb-1 text-[0.63rem] font-medium uppercase tracking-[0.16em]"
        style={{ color }}
      >
        {tag}
      </p>

      {/* Title */}
      <h3 className="font-orbitron mb-5 text-[1.05rem] font-bold text-[#E8E8F0]">{title}</h3>

      {/* Feature list */}
      <ul className="space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[0.85rem] leading-[1.5] text-[#9CA3AF]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              className="mt-[3px] shrink-0"
              style={{ color }}
            >
              <path
                d="M2.5 7L5.5 10L11.5 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {/* Learn more link */}
      <Link
        href={href}
        className="mt-6 flex items-center gap-1.5 text-[0.82rem] font-medium transition-all duration-150"
        style={{ color }}
        aria-label={`Go to ${title}`}
      >
        Explore
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M3 7h8M8 4l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  )
}

function FutureCard({ hint, delay }: { hint: string; delay: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.25rem] p-7"
      style={{
        border: '1.5px dashed rgba(129,140,248,0.2)',
        background: 'rgba(129,140,248,0.025)',
      }}
    >
      {/* Glass blur layer */}
      <div className="absolute inset-0 backdrop-blur-[1px]" aria-hidden="true" />

      <div className="relative flex flex-col items-center justify-center gap-4 py-6">
        {/* Question mark icon */}
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15"
          style={{ background: 'rgba(129,140,248,0.06)' }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(129,140,248,0.4)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <p
          className="font-jetbrains text-center text-[0.75rem] font-medium tracking-[0.12em] text-violet-400/40"
          style={{ animationDelay: delay }}
        >
          {hint}
        </p>

        {/* Pulsing dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 animate-pulse rounded-full bg-violet-500/25"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Icons ───────────────────────────────────────────────────────────────────

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.014.043.031.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  )
}

function EntertainmentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  )
}

function FinanceIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <circle cx="17" cy="15" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SocialIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
