// app/(dashboard)/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { auth } from '@/lib/api'

export const metadata = {
  title: 'Dashboard — Guana',
}

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get token from cookies (server-side)
  const cookieStore = cookies()
  const token = cookieStore.get('gk_access')?.value

  if (!token) {
    redirect('/entrar')
  }

  // Fetch user info
  let user
  try {
    user = await auth.me(token)
  } catch (error) {
    // Token is invalid or expired
    redirect('/entrar')
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
