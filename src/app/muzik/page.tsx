import { getCurrentUser } from '@/modules/auth/actions'
import Navbar from '@/shared/components/Navbar'

export default async function MuzikPage() {
  const user = await getCurrentUser()

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar user={user} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-orbitron text-2xl font-bold text-ink-primary">Muzik</h1>
          <p className="mt-1 text-sm text-ink-secondary">Coming soon</p>
        </div>
      </div>
    </main>
  )
}
