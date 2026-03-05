'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn, PLANS } from '@/lib/utils'
import { Loader2, Check, CreditCard, User, Building, Zap } from 'lucide-react'
import type { Profile, Tenant, Subscription, PricingPlan } from '@/types'

// Need to import PLANS from stripe lib (copy for client use)
const CLIENT_PLANS = [
  { id: 'free', name: 'Free', price: 0, features: ['50 leads', '1 member', 'Basic pipeline'] },
  { id: 'starter', name: 'Starter', price: 29, features: ['500 leads', '5 members', 'CSV export', 'Priority support'] },
  { id: 'pro', name: 'Pro', price: 79, popular: true, features: ['Unlimited leads', '25 members', 'API access', 'Analytics', 'Dedicated support'] },
  { id: 'enterprise', name: 'Enterprise', price: 199, features: ['Everything in Pro', 'Unlimited members', 'SSO/SAML', 'SLA', 'Custom integrations'] },
]

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Building },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [billingLoading, setBillingLoading] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [tenantName, setTenantName] = useState('')
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    setFullName(p?.full_name ?? '')
    if (p?.tenant_id) {
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', p.tenant_id).single(),
        supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).single(),
      ])
      setTenant(t)
      setTenantName(t?.name ?? '')
      setSubscription(s)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { init() }, [init])

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id)
    setSaving(false)
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    else toast({ title: 'Profile updated!' })
  }

  const saveTenant = async () => {
    if (!tenant) return
    setSaving(true)
    const { error } = await supabase.from('tenants').update({ name: tenantName }).eq('id', tenant.id)
    setSaving(false)
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    else toast({ title: 'Workspace updated!' })
  }

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return
    setBillingLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err: any) {
      toast({ title: 'Checkout failed', description: err.message, variant: 'destructive' })
      setBillingLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setBillingLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err: any) {
      toast({ title: 'Portal failed', description: err.message, variant: 'destructive' })
      setBillingLoading(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  )

  return (
    <div className="max-w-3xl animate-in">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Personal Information</h2>
            <p className="text-sm text-gray-500">Update your name and account details.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
              {fullName?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-medium text-gray-900">{profile?.email}</p>
              <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={profile?.email ?? ''} disabled className="bg-gray-50 text-gray-500" />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Profile
          </Button>
        </div>
      )}

      {/* Workspace Tab */}
      {tab === 'workspace' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Workspace Settings</h2>
            <p className="text-sm text-gray-500">Manage your organization&apos;s settings.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Workspace name</Label>
              <Input value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Workspace slug</Label>
              <Input value={tenant?.slug ?? ''} disabled className="bg-gray-50 text-gray-500 font-mono text-sm" />
              <p className="text-xs text-gray-400">This is your unique identifier and cannot be changed.</p>
            </div>
          </div>
          {profile?.role === 'owner' || profile?.role === 'admin' ? (
            <Button onClick={saveTenant} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Workspace
            </Button>
          ) : (
            <p className="text-sm text-gray-400">Only owners and admins can edit workspace settings.</p>
          )}
        </div>
      )}

      {/* Billing Tab */}
      {tab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Current Plan</h2>
                <p className="text-sm text-gray-500 mt-1">
                  You are on the <span className="font-medium capitalize text-indigo-600">{subscription?.plan ?? 'free'}</span> plan.
                </p>
              </div>
              {subscription?.plan !== 'free' && subscription?.stripe_customer_id && (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={billingLoading === 'portal'}
                >
                  {billingLoading === 'portal' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Manage Billing
                </Button>
              )}
            </div>
            {subscription?.current_period_end && (
              <p className="text-sm text-gray-500">
                {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'} on{' '}
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CLIENT_PLANS.map((plan) => {
              const isCurrent = subscription?.plan === plan.id
              const isPopular = (plan as any).popular
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative bg-white rounded-xl border-2 p-5 transition-all',
                    isPopular ? 'border-indigo-500' : 'border-gray-200',
                    isCurrent && 'ring-2 ring-indigo-200'
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      {plan.price > 0 && <span className="text-sm text-gray-500">/month</span>}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || plan.id === 'free' || billingLoading === plan.id}
                    className={cn(
                      'w-full',
                      isPopular && !isCurrent ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                    )}
                    variant={isCurrent || plan.id === 'free' ? 'outline' : 'default'}
                  >
                    {billingLoading === plan.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Free Forever' : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
