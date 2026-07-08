'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'done'

export default function FeatureSuggestion() {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setStatus('loading')
    // TODO: wire to a real Supabase insert or API route
    await new Promise<void>((resolve) => setTimeout(resolve, 700))
    setStatus('done')
    setValue('')
  }

  if (status === 'done') {
    return (
      <div className="mx-auto max-w-xl rounded-[1.25rem] border border-neon-green/20 bg-neon-green/[0.05] px-8 py-6 text-center">
        <div className="mb-3 flex justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-neon-green"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="font-orbitron text-[0.85rem] font-bold text-neon-green">Idea Received!</p>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-secondary">
          We&apos;ll review your suggestion. Thanks for building with us.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 cursor-pointer text-[0.8rem] text-ink-secondary underline transition hover:text-ink-primary"
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="feature-suggestion" className="sr-only">
          Feature suggestion
        </label>
        <input
          id="feature-suggestion"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Group task board, shared calendar, mini-games..."
          disabled={status === 'loading'}
          className="min-h-[48px] flex-1 rounded-[0.65rem] border border-surface-border bg-surface-elevated/30 px-4 text-[0.88rem] text-ink-primary placeholder-ink-muted outline-none transition-all duration-200 focus:border-brand/40 focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || status === 'loading'}
          className="min-h-[48px] cursor-pointer rounded-[0.65rem] bg-brand px-6 text-[0.88rem] font-semibold text-ink-primary shadow-brand-glow transition-all duration-200 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-75"
                />
              </svg>
              Sending...
            </span>
          ) : (
            'Suggest →'
          )}
        </button>
      </form>
    </div>
  )
}
