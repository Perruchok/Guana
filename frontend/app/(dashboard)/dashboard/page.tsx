// app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to eventos tab by default
  redirect('/dashboard/eventos')
}
