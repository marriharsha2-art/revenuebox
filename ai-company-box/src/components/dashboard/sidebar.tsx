'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { cn, getInitials } from '@/lib/utils'
import { Bot, LayoutDashboard, Users, Kanban, Settings, LogOut, CreditCard, Zap } from 'lucide-react'
import type { Profile, Subscription } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  profile: Profile & { tenants?: { name: string } | null }
  subscription: Subscription | null
}

export function DashboardSidebar({ profile, subscription }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const planBadgeColor = {
    free: 'bg-gray-100 text-gray-600',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-indigo-100 text-indigo-700',
    enterprise: 'bg-purple-100 text-purple-700',
  }[subscription?.plan ?? 'free']

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-none">AI Company Box</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">
              {(profile as any).tenants?.name ?? 'My Workspace'}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(href, exact)
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className={cn('w-4 h-4', isActive(href, exact) ? 'text-indigo-600' : 'text-gray-400')} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Upgrade banner */}
      {subscription?.plan === 'free' && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-indigo-600 mb-2">Unlock unlimited leads &amp; team members.</p>
          <Link
            href="/dashboard/settings?tab=billing"
            className="block text-center text-xs font-semibold bg-indigo-600 text-white rounded-md py-1.5 hover:bg-indigo-700 transition-colors"
          >
            View Plans
          </Link>
        </div>
      )}

      {/* User section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
            {getInitials(profile.full_name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', planBadgeColor)}>
            {subscription?.plan ?? 'free'}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
