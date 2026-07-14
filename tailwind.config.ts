import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        jetbrains: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
        // muzik module: HSL-var driven Inter-like sans (falls back to system).
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── muzikskul core (unchanged) ─────────────────────────────────────
        surface: {
          base:     '#09090f',
          card:     '#13131f',
          elevated: '#1c1c2e',
          border:   '#252538',
          // muzik module tokens (HSL vars, scoped to .muzik-scope in globals.css)
          DEFAULT:  'hsl(var(--surface))',
          2:        'hsl(var(--surface-2))',
        },
        brand: {
          DEFAULT: '#7c3aed',
          light:   '#a78bfa',
          dark:    '#5b21b6',
          glow:    'rgba(124, 58, 237, 0.35)',
        },
        accent: {
          DEFAULT: '#06b6d4',
          light:   '#67e8f9',
          glow:    'rgba(6, 182, 212, 0.35)',
        },
        neon: {
          green:  '#10b981',
          yellow: '#f59e0b',
          red:    '#ef4444',
        },
        ink: {
          primary:   '#f1f5f9',
          secondary: '#94a3b8',
          muted:     '#475569',
        },
        // ── muzik module tokens (HSL vars, scoped to .muzik-scope) ─────────
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // renamed from MMMuzik's `accent` to avoid colliding with muzikskul cyan accent
        'mmz-accent': {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      boxShadow: {
        'brand-glow':  '0 0 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(124, 58, 237, 0.15)',
        'accent-glow': '0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.15)',
        'card':        '0 1px 3px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.8)',
        'card-hover':  '0 4px 16px rgba(0,0,0,0.6)',
        // muzik module
        glow: '0 0 0 1px hsl(var(--primary) / 0.25), 0 12px 40px -12px hsl(var(--primary) / 0.45)',
        panel: '0 1px 0 0 hsl(var(--border) / 0.6), 0 12px 32px -16px rgb(0 0 0 / 0.6)',
      },
      backgroundImage: {
        'brand-gradient':  'linear-gradient(135deg, #7c3aed, #06b6d4)',
        'surface-gradient':'linear-gradient(180deg, #13131f, #09090f)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        equalizer: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
        wave: {
          '0%, 60%, 100%': { transform: 'rotate(0deg)' },
          '10%, 30%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.18s ease-out',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        equalizer: 'equalizer 0.9s ease-in-out infinite',
        wave: 'wave 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
