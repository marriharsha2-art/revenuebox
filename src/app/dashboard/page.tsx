import { createBrowserClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Users, DollarSign, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const profile = (await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single()).data
  const tenantId = profile?.tenant_id

  if (!tenantId) redirect('/auth/login')

  // Fetch stats in parallel
  const [leadsResult, dealsResult, wonDealsResult, recentLeadsResult] = await Promise.all([
    supabase.from('leads').select('id, status, created_at').eq('tenant_id', tenantId),
    supabase.from('deals').select('id, stage, value, created_at').eq('tenant_id', tenantId),
    supabase.from('deals').select('value').eq('tenant_id', tenantId).eq('stage', 'closed_won'),
    supabase.from('leads').select('id, first_name, last_name, email, company, status, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
  ])

  const leads = leadsResult.data ?? []
  const deals = dealsResult.data ?? []
  const wonDeals = wonDealsResult.data ?? []
  const recentLeads = recentLeadsResult.data ?? []

  const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const pipelineValue = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage)).reduce((sum, d) => sum + (d.value ?? 0), 0)
  const conversionRate = leads.length > 0 ? ((leads.filter(l => l.status === 'won').length / leads.length) * 100).toFixed(1) : '0'

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', up: true },
    { label: 'Pipeline Value', value: formatCurrency(pipelineValue), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+8%', up: true },
    { label: 'Revenue Closed', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', trend: '+23%', up: true },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50', trend: '-2%', up: false },
  ]

  const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-purple-100 text-purple-700',
    proposal: 'bg-orange-100 text-orange-700',
    negotiation: 'bg-pink-100 text-pink-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, trend, up }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
                {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Leads</h2>
            <a href="/dashboard/leads" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLeads.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No leads yet. <a href="/dashboard/leads" className="text-indigo-600">Add your first lead →</a></p>
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                    {lead.first_name?.[0]}{lead.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{lead.first_name} {lead.last_name}</p>
                    <p className="text-xs text-gray-400 truncate">{lead.company ?? lead.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {lead.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pipeline</h2>
            <a href="/dashboard/pipeline" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View →</a>
          </div>
          <div className="p-6 space-y-4">
            {[
              { stage: 'Prospecting', count: deals.filter(d => d.stage === 'prospecting').length, color: 'bg-indigo-500' },
              { stage: 'Qualification', count: deals.filter(d => d.stage === 'qualification').length, color: 'bg-purple-500' },
              { stage: 'Proposal', count: deals.filter(d => d.stage === 'proposal').length, color: 'bg-amber-500' },
              { stage: 'Negotiation', count: deals.filter(d => d.stage === 'negotiation').length, color: 'bg-orange-500' },
              { stage: 'Closed Won', count: deals.filter(d => d.stage === 'closed_won').length, color: 'bg-green-500' },
            ].map(({ stage, count, color }) => (
              <div key={stage} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                <span className="text-sm text-gray-600 flex-1">{stage}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: deals.length > 0 ? `${(count / deals.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
