import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // ─── Checkout completed ───────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { tenantId } = session.metadata ?? {}
        if (!tenantId || !session.subscription || !session.customer) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id
        const plan = getPlanFromPriceId(priceId)

        await supabase.from('subscriptions').upsert({
          tenant_id: tenantId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          plan,
          status: subscription.status as any,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        } as any) , { onConflict: 'tenant_id' }

        // Log activity
        await supabase.from('activities').insert({
          tenant_id: tenantId,
          entity_type: 'subscription',
          entity_id: subscription.id,
          action: `Subscribed to ${plan} plan`,
          metadata: { plan, priceId },
        } as any)
        break
      }

      // ─── Subscription updated ─────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const { tenantId } = subscription.metadata ?? {}
        if (!tenantId) break

        const priceId = subscription.items.data[0]?.price.id
        const plan = getPlanFromPriceId(priceId)

        await (supabase.from('subscriptions') as any).update({
          stripe_price_id: priceId,
          plan,
          status: subscription.status as any,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('stripe_subscription_id', subscription.id)
        break
      }

      // ─── Subscription deleted/canceled ───────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await (supabase.from('subscriptions') as any).update({
          plan: 'free',
          status: 'canceled',
          stripe_subscription_id: null,
          stripe_price_id: null,
          cancel_at_period_end: false,
        }).eq('stripe_subscription_id', subscription.id)
        break
      }

      // ─── Invoice paid ─────────────────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          await (supabase.from('subscriptions') as any).update({
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq('stripe_subscription_id', subscription.id)
        }
        break
      }

      // ─── Invoice payment failed ───────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await (supabase.from('subscriptions') as any).update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`Webhook handler error: ${error.message}`)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
