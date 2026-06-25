import LoginButton from '@/modules/auth/components/LoginButton'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base">
      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-8 shadow-card">
        <div className="mb-8 text-center">
          <h1 className="font-orbitron text-2xl font-bold text-ink-primary">Muzikskul</h1>
          <p className="mt-2 text-sm text-ink-secondary">Sign in to continue</p>
        </div>

        <OAuthErrorBanner searchParams={searchParams} />

        <LoginButton />
      </div>
    </main>
  )
}

async function OAuthErrorBanner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  if (!error) return null

  return (
    <div className="mb-4 rounded-lg bg-neon-red/10 px-4 py-3 text-sm text-neon-red">
      Login failed. Please try again.
    </div>
  )
}
