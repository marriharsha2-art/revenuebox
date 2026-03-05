// ============================================
// Database Types
// ============================================

export type UserRole = 'owner' | 'admin' | 'member'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type LeadSource = 'manual' | 'website' | 'referral' | 'social' | 'email' | 'cold_outreach' | 'other'
export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  tenant_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  tenant_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  company: string | null
  title: string | null
  source: LeadSource
  status: LeadStatus
  value: number
  notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  // Joined fields
  assignee?: Profile
}

export interface Deal {
  id: string
  tenant_id: string
  lead_id: string | null
  title: string
  value: number
  stage: DealStage
  probability: number
  expected_close_date: string | null
  assigned_to: string | null
  notes: string | null
  position: number
  created_at: string
  updated_at: string
  // Joined fields
  assignee?: Profile
  lead?: Lead
}

export interface Activity {
  id: string
  tenant_id: string
  user_id: string | null
  entity_type: 'lead' | 'deal' | 'subscription'
  entity_id: string
  action: string
  metadata: Record<string, unknown>
  created_at: string
}

// ============================================
// Supabase Database Types (for type-safe client)
// ============================================

export type Database = {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Partial<Tenant>; Update: Partial<Tenant> }
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> }
      leads: { Row: Lead; Insert: Partial<Lead>; Update: Partial<Lead> }
      deals: { Row: Deal; Insert: Partial<Deal>; Update: Partial<Deal> }
      activities: { Row: Activity; Insert: Partial<Activity>; Update: Partial<Activity> }
    }
  }
}

// ============================================
// App-level types
// ============================================

export interface PipelineColumn {
  id: DealStage
  title: string
  color: string
  deals: Deal[]
}

export interface DashboardStats {
  totalLeads: number
  totalDeals: number
  totalRevenue: number
  conversionRate: number
  leadsThisMonth: number
  dealsThisMonth: number
}

export interface PricingPlan {
  id: SubscriptionPlan
  name: string
  price: number
  priceId: string
  features: string[]
  popular?: boolean
}
