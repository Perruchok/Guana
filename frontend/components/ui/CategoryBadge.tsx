type CategoryBadgeProps = {
  category: string
}

const CATEGORY_STYLES: Record<string, string> = {
  // Backend canonical values (EN)
  music: 'bg-blue-600 text-white',
  exhibition: 'bg-violet-600 text-white',
  theater: 'bg-slate-600 text-white',
  dance: 'bg-pink-600 text-white',
  art: 'bg-orange-500 text-white',
  workshop: 'bg-teal-600 text-white',
  cinema: 'bg-red-600 text-white',
  festival: 'bg-green-600 text-white',
  literature: 'bg-amber-600 text-white',
  conference: 'bg-indigo-600 text-white',
  performance: 'bg-rose-600 text-white',

  // Aliases (ES)
  musica: 'bg-blue-600 text-white',
  cultura: 'bg-violet-600 text-white',
  teatro: 'bg-slate-600 text-white',
  danza: 'bg-pink-600 text-white',
  arte: 'bg-orange-500 text-white',
  literatura: 'bg-amber-600 text-white',
  conferencia: 'bg-indigo-600 text-white',
}

const BASE_CLASSES = 'inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-0.5'

function capitalizeLabel(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const normalizedCategory = category.trim().toLowerCase()
  const colorClassName = CATEGORY_STYLES[normalizedCategory] ?? 'bg-slate-500 text-white'
  const label = capitalizeLabel(category)

  return (
    <span className={[BASE_CLASSES, colorClassName].join(' ')}>
      {label}
    </span>
  )
}
