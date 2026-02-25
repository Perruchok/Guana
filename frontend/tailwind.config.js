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
        cream:      '#F5F0E8',
        ink:        '#1A1612',
        terracota:  '#C4622D',
        gold:       '#D4A853',
        sage:       '#6B7F5E',
        stone:      '#8C7B6B',
        pale:       '#EDE8DF',
        border:     '#D6CEBC',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3.2rem, 7vw, 6rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
      },
    },
  },
  plugins: [],
}
