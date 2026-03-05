import Stripe from 'stripe'
import type { PricingPlan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    features: [
      'Up to 50 leads',
      'Basic pipeline (3 stages)',
      '1 team member',
      'Email support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    features: [
      'Up to 500 leads',
      'Full pipeline (6 stages)',
      '5 team members',
      'CSV export',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    priceId: process.env.STRIPE_PRICE_PRO || '',
    popular: true,
    features: [
      'Unlimited leads',
      'Custom pipeline stages',
      '25 team members',
      'API access',
      'Advanced analytics',
      'Slack integration',
      'Dedicated support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom subdomain',
      'SSO / SAML',
      'SLA guarantee',
      'Custom integrations',
      'Onboarding manager',
    ],
  },
]

export async function createCheckoutSession({
  priceId,
  customerId,
  tenantId,
  userId,
  successUrl,
  cancelUrl,
}: {
  priceId: string
  customerId?: string
  tenantId: string
  userId: string
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenantId, userId },
    subscription_data: {
      metadata: { tenantId, userId },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  })
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter'
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro'
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return 'enterprise'
  return 'free'
}
