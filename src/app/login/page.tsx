import LoginButton from '@/modules/auth/components/LoginButton'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Muzikskul</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to continue</p>
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
    <div className="mb-4 rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300">
      Login failed. Please try again.
    </div>
  )
}
