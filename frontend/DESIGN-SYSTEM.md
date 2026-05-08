# Guana Go — Design System
> Single source of truth for all frontend decisions.
> Every Copilot prompt must reference this file.
> Do not invent values. Do not use Tailwind defaults that conflict with these.

---

## 1. Color Palette

### Brand Colors (use these class names in ALL new components)

| Token name        | Hex       | Tailwind class          | Usage                              |
|-------------------|-----------|-------------------------|------------------------------------|
| brand-navy        | #1E293B   | `bg-brand-navy`         | Navbar, Footer, dark surfaces      |
| brand-blue        | #2563EB   | `bg-brand-blue`         | Primary buttons, CTAs              |
| brand-blue-light  | #3B82F6   | `bg-brand-blue-light`   | Hover states, links                |
| brand-purple      | #7C3AED   | `bg-brand-purple`       | Cultura category badge             |
| brand-yellow      | #F59E0B   | `bg-brand-yellow`       | Accent, highlights                 |
| brand-slate       | #475569   | `bg-brand-slate`        | Teatro/default category badge      |
| brand-dark        | #111827   | `bg-brand-dark`         | Event cards background             |
| brand-bg          | #F3F4F6   | `bg-brand-bg`           | Page background                    |

### Category Badge Color Map (strict — no exceptions)

| Category value  | Background class    | Text  |
|-----------------|---------------------|-------|
| musica          | `bg-blue-600`       | white |
| cultura         | `bg-violet-600`     | white |
| teatro          | `bg-brand-slate`    | white |
| danza           | `bg-pink-600`       | white |
| arte            | `bg-orange-500`     | white |
| workshop        | `bg-teal-600`       | white |
| cinema          | `bg-red-600`        | white |
| festival        | `bg-green-600`      | white |
| literature      | `bg-amber-600`      | white |
| conference      | `bg-indigo-600`     | white |
| performance     | `bg-rose-600`       | white |
| other / default | `bg-brand-slate`    | white |

### Text Colors

| Usage              | Class                  |
|--------------------|------------------------|
| Primary text       | `text-gray-900`        |
| Secondary text     | `text-slate-400`       |
| Hint / meta text   | `text-slate-500`       |
| On dark surfaces   | `text-white`           |
| Links              | `text-brand-blue-light`|

### Page Background
- **All pages**: `bg-brand-bg` (`#F3F4F6`)
- Set on `<body>` in `globals.css` and on the root layout wrapper

---

## 2. Typography

### Font Stack
- **Display / Hero headings**: system bold, `font-extrabold`, `tracking-tight`
- **UI / Body**: system sans, `font-sans`
- No external fonts required at MVP. Remove Playfair and DM Sans references.

### Scale

| Role            | Size class         | Weight class      | Additional                  |
|-----------------|--------------------|-------------------|-----------------------------|
| Hero title      | `text-4xl md:text-6xl` | `font-extrabold` | `leading-none tracking-tight` |
| Section heading | `text-2xl`         | `font-bold`       |                              |
| Card title      | `text-sm`          | `font-semibold`   | `line-clamp-2`              |
| Body            | `text-sm`          | `font-normal`     | `leading-relaxed`           |
| Meta / label    | `text-xs`          | `font-medium`     | `text-slate-400`            |
| Badge           | `text-xs`          | `font-semibold`   |                              |
| Nav link        | `text-sm`          | `font-medium`     |                              |

---

## 3. Spacing Scale

Use only these values. Do not invent intermediate values.

| Token | Value  | Usage example                        |
|-------|--------|--------------------------------------|
| xs    | 4px    | Icon gaps, tight internal padding    |
| sm    | 8px    | Badge padding, small gaps            |
| md    | 16px   | Card body padding, section gaps      |
| lg    | 24px   | Card margin, section padding         |
| xl    | 32px   | Section vertical rhythm              |
| 2xl   | 48px   | Hero padding, large section gaps     |
| 3xl   | 64px   | Page-level vertical spacing          |

---

## 4. Border Radius

| Token  | Value   | Class          | Usage                        |
|--------|---------|----------------|------------------------------|
| sm     | 4px     | `rounded`      | Badges, small chips          |
| md     | 8px     | `rounded-lg`   | Buttons, inputs              |
| lg     | 12px    | `rounded-xl`   | Cards                        |
| full   | 9999px  | `rounded-full` | Pills, icon buttons, dots    |

---

## 5. Shadows

| Token       | Value                          | Usage              |
|-------------|--------------------------------|--------------------|
| shadow-sm   | `0 1px 3px rgba(0,0,0,0.08)`  | Cards default      |
| shadow-md   | `0 4px 16px rgba(0,0,0,0.12)` | Cards on hover     |

---

## 6. Component Specs

### Navbar
- Background: `bg-brand-bg` with subtle divider `border-slate-200`
- Height: `h-20`
- Logo block: two lines, main wordmark in `text-gray-900 font-extrabold tracking-tight`, tagline in `text-gray-900 text-xs font-semibold uppercase`
- Nav links: `text-slate-500 hover:text-gray-900 text-sm font-semibold uppercase tracking-wide transition-colors`
- Active link: `text-brand-blue border-b-2 border-brand-blue`
- Right side:
  - Search: `bg-slate-200 text-slate-700 placeholder-slate-500 rounded-full text-xs font-semibold uppercase tracking-wide py-1.5 pl-4 pr-9`
  - Auth icon button: single icon — shows UserCircle if NOT logged in (→ /login), 
    shows UserCircle with different fill if logged in (→ /perfil or dropdown)
    icons use `text-brand-blue hover:text-brand-blue-light`
  - **Directorio link must be preserved** as a nav item linking to /directorio

### CategoryBadge
- Props: `category: string`
- Implementation: lookup object (NOT a switch, NOT if/else chain)
  ```ts
  const CATEGORY_STYLES: Record<string, string> = {
    musica:      'bg-blue-600 text-white',
    cultura:     'bg-violet-600 text-white',
    teatro:      'bg-slate-600 text-white',
    danza:       'bg-pink-600 text-white',
    arte:        'bg-orange-500 text-white',
    workshop:    'bg-teal-600 text-white',
    cinema:      'bg-red-600 text-white',
    festival:    'bg-green-600 text-white',
    literature:  'bg-amber-600 text-white',
    conference:  'bg-indigo-600 text-white',
    performance: 'bg-rose-600 text-white',
  }
  const classes = CATEGORY_STYLES[category.toLowerCase()] ?? 'bg-slate-500 text-white'
  ```
- Base classes: `rounded-full text-xs font-semibold px-2.5 py-0.5`
- CRITICAL: Tailwind purges dynamic classes. All bg-* classes must be in the 
  lookup object as complete strings, never constructed with string interpolation.

### EventCard
- Background: `bg-brand-dark` (`#111827`)
- Border radius: `rounded-xl`
- **Behaviour: onClick opens EventModal — does NOT navigate to /eventos/slug**
- Image: Next.js `<Image>` fill + objectFit cover, aspect-video
- On hover: `scale-[1.02] transition-transform duration-200`
- The card receives an `onClick: () => void` prop — the parent (EventsGrid) 
  manages which event is selected and passes it to EventModal

### EventModal
- Triggered by EventCard click, managed in EventsGrid via selectedEvent state
- Background: `bg-brand-dark` with `bg-brand-navy` header area
- Text: `text-white` on dark surfaces
- Two action buttons:
  - Primary: `bg-brand-blue hover:bg-brand-blue-light text-white rounded-lg px-4 py-2`
  - Secondary: `border border-slate-600 text-slate-300 hover:text-white rounded-lg px-4 py-2`
- Close button: top-right, `text-slate-400 hover:text-white`
- CategoryBadge rendered inside the modal header

### EventsGrid + FilterModal
- Controls row order: `Filtrar por` button → `Borrar filtros:` label (if active) → active filter badges → search input
- Filter trigger button: `bg-brand-blue hover:bg-brand-blue-light text-white rounded-full text-xs font-semibold uppercase tracking-wide px-5 py-2`
- `Tipo de evento` in FilterModal is **multi-select**: users can select multiple categories at the same time
- Each selected category renders its own active badge in the controls row; removing a badge only removes that category
- Active filter badges: `border border-slate-300 bg-white text-slate-500 rounded-full text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1`
  each badge includes a colored dot (`h-3 w-3 rounded-full`) and × to remove
- Category dot colors must map to category palette:
  music `bg-blue-600`, performance `bg-rose-600`, cinema `bg-red-600`, workshop `bg-teal-600`,
  exhibition `bg-violet-600`, dance `bg-pink-600`, art `bg-orange-500`, literature `bg-amber-600`,
  festival `bg-green-600`, conference `bg-indigo-600`, theater/other `bg-brand-slate`
- `Gratis` badge uses dot color `bg-brand-yellow`
- Clear label button: `text-slate-500 hover:text-gray-700 text-xs font-semibold uppercase tracking-wide`
- Search input (same row): `rounded-full bg-slate-200 text-slate-700 placeholder-slate-500 text-xs font-semibold uppercase tracking-wide py-2 pl-4 pr-9`
- FilterModal background: `bg-white` (light modal on dark page — intentional contrast)
  - Headings: `text-gray-900 font-semibold`
  - Options: `text-gray-700`
  - Category/date/price options: `border-slate-300 text-gray-700 rounded-lg`; selected state `bg-blue-100 text-blue-800 border-blue-200`
  - Apply button: `bg-brand-blue text-white rounded-lg`
  - Cancel: `text-slate-500 hover:text-gray-700`

### Home Directorio Preview
- Section background: `bg-brand-bg` with top divider `border-slate-300`
- Heading block centered:
  - Title: `text-brand-blue text-4xl font-extrabold uppercase italic tracking-tight`
  - Description: `text-slate-500 text-sm leading-tight` with emphasized terms in `italic font-semibold text-slate-700`
- Cards layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`, max 3 featured venues
- Card style: `relative aspect-[4/5] rounded-2xl overflow-hidden border border-slate-300 bg-white`
  with image cover and subtle zoom on hover
- Top category pill: `bg-white/95 rounded-full text-[10px] font-semibold uppercase tracking-wide text-slate-600 px-2 py-1`
  with a left dot `h-2.5 w-2.5 rounded-full bg-brand-blue`
- Bottom overlay:
  - Venue name pill: `bg-white rounded-full text-xs font-semibold uppercase tracking-wide text-slate-700 px-3 py-1.5`
  - Two circular icon chips: `h-7 w-7 rounded-full bg-white text-brand-blue`
- Bottom CTA: centered `Ver más ›` link using
  `text-brand-blue hover:text-brand-blue-light text-xl font-extrabold uppercase italic tracking-tight`

### Directorio Page
- Page shell: `bg-brand-bg` with centered container `max-w-6xl px-6 md:px-10 py-12 md:py-16`
- Header block: top divider `border-t border-slate-300`, centered title and subtitle
  - Title: `text-brand-blue text-4xl md:text-5xl font-extrabold uppercase italic tracking-tight`
  - Subtitle: `text-slate-500 text-sm md:text-base leading-tight`
- Category filters row:
  - Chips are `rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide`
  - Active chip: `bg-brand-blue text-white`
  - Inactive chip: `border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-gray-800`
- Venue cards grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`
  with card pattern identical to Home Directorio preview cards
- Empty state: `rounded-xl border border-slate-300 bg-white p-8 text-center`
  - Message: `text-slate-500`
  - Action link: `text-brand-blue hover:text-brand-blue-light text-sm font-semibold`

### HeroCarousel
- Left and right margins: `px-[10%]` on the text content block only
- The background image remains full-bleed (no side margins on the image)
- Text block: `pl-[10%]` from left edge

### Footer
- Background: `bg-brand-navy`
- Layout: `grid grid-cols-1 md:grid-cols-4 gap-8 px-8 md:px-16 py-12`
- Column 1: Logo + tagline + social icons (no stacked layout — use flex-row for icons)
- Column 2: FAQS links list
- Column 3: Contact info (single instance — not duplicated)
- Column 4: Email only
- Bottom bar: single row, flex justify-between, `border-t border-white/10 mt-8 pt-4`
- **Do NOT duplicate contact info columns** — the design had col 3 appear twice, 
  that was a bug in the prompt. Col 4 = email only.

---

## 7. Global Styles (globals.css)

This file must exist at `app/globals.css` and contain at minimum:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #F3F4F6;
  color: #111827;
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

---

## 8. Rules — What NOT to Do

1. **Never use old color tokens**: cream, ink, terracota, gold, sage, stone, pale, border
   in new components. They exist in tailwind.config.js only for backward compat.
2. **Never construct Tailwind classes dynamically**: 
   - WRONG: `` `bg-${color}-600` ``
   - RIGHT: full class string in a lookup object
3. **Never navigate on EventCard click** — always open EventModal
4. **Never duplicate layout sections** in Footer
5. **Never remove the Directorio nav link** from Navbar
6. **Never use font-display or font-mono** in new components (legacy tokens)
7. **Page background is always bg-brand-bg** — never white, never gray-100

---

## 9. File Locations

```
frontend/
├── app/
│   ├── globals.css          ← must exist, sets body bg + base styles
│   └── layout.tsx           ← root layout, applies bg-brand-bg to <body>
├── components/
│   ├── events/
│   │   ├── EventCard.tsx    ← onClick opens modal, no navigation
│   │   ├── EventModal.tsx   ← receives event prop + onClose
│   │   └── FilterModal.tsx  ← light bg, brand-blue apply button
│   ├── layout/
│   │   ├── Navbar.tsx       ← brand-navy bg, auth icon, directorio link
│   │   └── Footer.tsx       ← brand-navy, 4 cols, no duplicate contact
│   ├── sections/
│   │   └── HeroCarousel.tsx ← full-bleed image, 10% text margin
│   └── ui/
│       └── CategoryBadge.tsx ← lookup object, full class strings
└── DESIGN_SYSTEM.md         ← this file
```

---

## 10. tailwind.config.js (canonical version)

```js
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
```