import Link from 'next/link'
import Navbar from '@/shared/components/Navbar'
import WaveformCanvas from '@/shared/components/WaveformCanvas'
import FeatureSuggestion from '@/shared/components/FeatureSuggestion'
import { getCurrentUser } from '@/modules/auth/actions'

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-base text-ink-primary">
      {/* Scanline overlay — purely decorative, not a design-system color */}
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
        {/* Subtle grid — multi-stop background pattern, kept as style since Tailwind
            utilities can't express a repeating grid line pattern; color matches accent */}
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
        {/* Ambient glow blobs — accent + brand tint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 15% 55%, rgba(6,182,212,0.07) 0%, transparent 65%), radial-gradient(ellipse 50% 55% at 85% 45%, rgba(124,58,237,0.06) 0%, transparent 65%)',
          }}
        />

        <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:min-h-[calc(100vh-56px)] lg:grid-cols-[1fr_420px] lg:gap-16 lg:px-8">

          {/* Left: copy */}
          <div className="order-2 lg:order-1">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.08] px-3.5 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-light" />
              <span className="font-jetbrains text-[0.68rem] font-medium uppercase tracking-[0.14em] text-accent-light">
                For students &amp; friend groups
              </span>
            </div>

            <h1 className="mb-6 font-orbitron text-[clamp(2rem,5vw,4rem)] font-black leading-[1.06] tracking-[-0.015em]">
              <span className="block text-ink-primary">The Ultimate</span>
              <span className="block bg-brand-gradient bg-clip-text text-transparent">
                Digital Hub
              </span>
              <span className="block text-[0.58em] font-bold tracking-[0.01em] text-ink-muted">
                for Your Inner Circle
              </span>
            </h1>

            <p className="mb-10 max-w-[490px] text-[0.97rem] leading-[1.8] text-ink-secondary">
              Stream music, watch movies, split bills, manage class funds, and share
              stories—all in one shared space.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={user ? '/class-wallet' : '/login'}
                className="flex items-center gap-2.5 rounded-[0.65rem] bg-brand px-6 py-3 text-[0.88rem] font-semibold text-ink-primary shadow-brand-glow transition-all duration-200 hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base active:scale-[0.97]"
              >
                Get Started →
              </Link>
              <a
                href="#ecosystem"
                className="flex items-center rounded-[0.65rem] border border-surface-border bg-transparent px-6 py-3 text-[0.88rem] font-semibold text-ink-secondary transition-all duration-200 hover:border-brand hover:bg-surface-elevated hover:text-brand-light"
              >
                Explore Features →
              </a>
            </div>
          </div>

          {/* Right: oscilloscope panel */}
          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-[1.25rem] border border-surface-border bg-gradient-to-br from-accent/[0.04] to-surface-base shadow-accent-glow">
              {/* Title bar */}
              <div className="flex items-center gap-1.5 border-b border-surface-border bg-surface-elevated/40 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-neon-red" />
                <span className="h-2.5 w-2.5 rounded-full bg-neon-yellow" />
                <span className="h-2.5 w-2.5 rounded-full bg-neon-green" />
                <span className="ml-auto font-jetbrains text-[0.65rem] font-medium uppercase tracking-[0.14em] text-ink-muted">
                  Live Signal
                </span>
              </div>
              {/* Canvas */}
              <div className="h-[190px] w-full bg-surface-base">
                <WaveformCanvas />
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 border-t border-surface-border">
                <div className="border-r border-surface-border px-4 py-3">
                  <p className="mb-0.5 font-jetbrains text-[0.68rem] text-ink-muted">Class Fund</p>
                  <p className="font-orbitron text-[1rem] font-bold text-neon-yellow drop-shadow-[0_0_14px_rgba(245,158,11,0.5)]">
                    ₫1.2M
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="mb-0.5 font-jetbrains text-[0.68rem] text-ink-muted">Listening now</p>
                  <p className="font-orbitron text-[1rem] font-bold text-accent drop-shadow-[0_0_14px_rgba(6,182,212,0.5)]">
                    3 rooms
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM GRID ──────────────────────────────────────────── */}
      <section id="ecosystem" className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <SectionDivider color="rgba(6,182,212,0.18)" />

        <div className="mx-auto max-w-[1100px]">
          <div className="mb-16 text-center">
            <p className="font-jetbrains mb-3 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-accent">
              Core Features
            </p>
            <h2 className="font-orbitron text-[clamp(1.55rem,3.5vw,2.4rem)] font-black leading-[1.15] tracking-[-0.01em] text-ink-primary">
              One Space.
              <br />
              Every Service.
            </h2>
            <p className="mx-auto mt-4 max-w-[480px] text-[0.92rem] leading-[1.75] text-ink-secondary">
              Three interconnected hubs built for the way your group actually lives—not
              how you wish you did.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
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
              color="#7c3aed"
              glowRgb="124,58,237"
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
              color="#10b981"
              glowRgb="16,185,129"
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
      <section className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <SectionDivider color="rgba(124,58,237,0.18)" />
        {/* Ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 50% at 50% 50%, rgba(124,58,237,0.04) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-[1100px]">
          <div className="mb-16 text-center">
            <p className="font-jetbrains mb-3 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-brand-light">
              Future Lab
            </p>
            <h2 className="font-orbitron text-[clamp(1.55rem,3.5vw,2.4rem)] font-black leading-[1.15] tracking-[-0.01em] text-ink-primary">
              The Evolution
              <br />
              Never Stops
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-[0.92rem] leading-[1.75] text-ink-secondary">
              We are constantly building new tools for your squad. Have an idea? Suggest
              it below.
            </p>
          </div>

          {/* Placeholder cards */}
          <div className="mb-14 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            <FutureCard hint="Feature Loading..." delay="0s" />
            <FutureCard hint="Coming Soon..." delay="0.15s" />
            <FutureCard hint="In Development" delay="0.3s" />
          </div>

          {/* Suggestion input */}
          <FeatureSuggestion />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border bg-surface-base px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-6">
          <div>
            <p className="font-orbitron text-[0.72rem] font-bold uppercase tracking-[0.2em] text-ink-primary">
              Muzik<span className="text-accent">skul</span>
            </p>
            <p className="mt-1 font-jetbrains text-[0.73rem] text-ink-muted">
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
                  className="text-[0.82rem] text-ink-secondary transition-colors duration-150 hover:text-ink-primary"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="font-jetbrains text-[0.7rem] text-ink-muted">© 2026 Muzikskul</p>
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

// color/glowRgb are always one of the design-system token hex values (accent,
// brand, neon-green) passed per card; still needs `style` because Tailwind
// can't compile a className from a runtime template literal.
function EcosystemCard({ color, glowRgb, icon, tag, title, features, href }: EcosystemCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-[1.25rem] border border-surface-border p-6 transition-all duration-300 hover:-translate-y-1.5 sm:p-7"
      style={{
        background: `linear-gradient(135deg, rgba(${glowRgb},0.06) 0%, rgba(9,9,15,0.95) 55%)`,
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
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border"
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
      <h3 className="font-orbitron mb-5 text-[1.05rem] font-bold text-ink-primary">{title}</h3>

      {/* Feature list */}
      <ul className="space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[0.85rem] leading-[1.5] text-ink-secondary">
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
      className="relative overflow-hidden rounded-[1.25rem] p-6 sm:p-7"
      style={{
        border: '1.5px dashed rgba(124,58,237,0.2)',
        background: 'rgba(124,58,237,0.025)',
      }}
    >
      {/* Glass blur layer */}
      <div className="absolute inset-0 backdrop-blur-[1px]" aria-hidden="true" />

      <div className="relative flex flex-col items-center justify-center gap-4 py-6">
        {/* Question mark icon */}
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/15"
          style={{ background: 'rgba(124,58,237,0.06)' }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(124,58,237,0.4)"
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
          className="font-jetbrains text-center text-[0.75rem] font-medium tracking-[0.12em] text-brand-light/40"
          style={{ animationDelay: delay }}
        >
          {hint}
        </p>

        {/* Pulsing dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 animate-pulse rounded-full bg-brand/25"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Icons ───────────────────────────────────────────────────────────────────

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
