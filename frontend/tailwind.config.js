/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Legacy (do not use in new components) ──
        cream:     '#F5F0E8',
        ink:       '#1A1612',
        terracota: '#C4622D',
        gold:      '#D4A853',
        sage:      '#6B7F5E',
        stone:     '#8C7B6B',
        pale:      '#EDE8DF',
        border:    '#D6CEBC',

        // ── Guana Go Design System ──
        brand: {
          navy:        '#1E293B',
          blue:        '#2563EB',
          'blue-light':'#3B82F6',
          purple:      '#7C3AED',
          yellow:      '#F59E0B',
          slate:       '#475569',
          dark:        '#111827',
          bg:          '#F3F4F6',
        },
      },
      fontFamily: {
        // Legacy only
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3.2rem, 7vw, 6rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        'sm':   '4px',
        'md':   '8px',
        'lg':   '12px',
        'full': '9999px',
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}