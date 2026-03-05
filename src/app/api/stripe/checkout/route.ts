import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createCheckoutSession, PLANS } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { planId } = await req.json()
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const plan = PLANS.find(p => p.id === planId)
    if (!plan || !plan.priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single()
    if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant found' }, { status: 400 })

    const { data: subscription } = await supabase.from('subscriptions').select('stripe_customer_id').eq('tenant_id', profile.tenant_id).single()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const checkoutSession = await createCheckoutSession({
      priceId: plan.priceId,
      customerId: subscription?.stripe_customer_id ?? undefined,
      tenantId: profile.tenant_id,
      userId: session.user.id,
      successUrl: `${baseUrl}/dashboard/settings?tab=billing&success=true`,
      cancelUrl: `${baseUrl}/dashboard/settings?tab=billing`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
