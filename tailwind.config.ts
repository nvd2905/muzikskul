import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        jetbrains: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Surface hierarchy — dark backgrounds from deepest to most elevated
        surface: {
          base:     '#09090f', // page background
          card:     '#13131f', // default card/panel
          elevated: '#1c1c2e', // modals, dropdowns, hover states
          border:   '#252538', // subtle dividers and outlines
        },
        // Primary brand — violet/purple
        brand: {
          DEFAULT: '#7c3aed',
          light:   '#a78bfa',
          dark:    '#5b21b6',
          glow:    'rgba(124, 58, 237, 0.35)',
        },
        // Secondary accent — electric cyan
        accent: {
          DEFAULT: '#06b6d4',
          light:   '#67e8f9',
          glow:    'rgba(6, 182, 212, 0.35)',
        },
        // Semantic states
        neon: {
          green:  '#10b981',
          yellow: '#f59e0b',
          red:    '#ef4444',
        },
        // Text scale
        ink: {
          primary:   '#f1f5f9', // headings, strong labels
          secondary: '#94a3b8', // body text, descriptions
          muted:     '#475569', // placeholders, disabled
        },
      },
      boxShadow: {
        'brand-glow':  '0 0 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(124, 58, 237, 0.15)',
        'accent-glow': '0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.15)',
        'card':        '0 1px 3px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.8)',
        'card-hover':  '0 4px 16px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'brand-gradient':  'linear-gradient(135deg, #7c3aed, #06b6d4)',
        'surface-gradient':'linear-gradient(180deg, #13131f, #09090f)',
      },
    },
  },
  plugins: [],
}

export default config
