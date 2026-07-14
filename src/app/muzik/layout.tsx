import type { ReactNode } from 'react'
import { ThemeProvider } from '@/modules/muzik/components/theme-provider'
import { Toaster } from '@/modules/muzik/components/ui/sonner'

// `.muzik-scope` activates the ported MMMuzik design tokens (globals.css) without
// leaking them onto muzikskul's other routes. Dark-only; theme switching is inert.
export default function MuzikLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <div className="muzik-scope min-h-dvh">
        {children}
        <Toaster />
      </div>
    </ThemeProvider>
  )
}
