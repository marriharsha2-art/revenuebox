import { redirect } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch profile + tenant + subscription in parallel
  const [profileResult, tenantResult] = await Promise.all([
    supabase.from('profiles').select('*, tenants(*)').eq('id', session.user.id).single(),
    supabase.from('subscriptions').select('*').eq('tenant_id',
      ((await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single()) as any).data?.tenant_id ?? ''
    ).single(),
  ])

  const profile = profileResult.data
  const subscription = tenantResult.data

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar profile={profile} subscription={subscription} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader profile={profile} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
