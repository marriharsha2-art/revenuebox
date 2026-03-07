'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types'

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Overview', description: 'Welcome back — here\'s your sales snapshot.' },
  '/dashboard/leads': { title: 'Leads', description: 'Manage and track all your prospects.' },
  '/dashboard/pipeline': { title: 'Pipeline', description: 'Visualize and move deals through stages.' },
  '/dashboard/settings': { title: 'Settings', description: 'Manage your account and workspace.' },
}

export function DashboardHeader({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  // Match longest prefix
  const pageKey = Object.keys(PAGE_TITLES)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]

  const { title, description } = PAGE_TITLES[pageKey] ?? { title: 'Dashboard', description: '' }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
