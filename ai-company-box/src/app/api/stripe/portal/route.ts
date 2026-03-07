import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single()
    if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

    const { data: subscription } = await supabase.from('subscriptions').select('stripe_customer_id').eq('tenant_id', profile.tenant_id).single()
    if (!subscription?.stripe_customer_id) return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const portalSession = await createBillingPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${baseUrl}/dashboard/settings?tab=billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
