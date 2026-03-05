import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { LeadStatus, DealStage, SubscriptionPlan } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  qualified: { label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  proposal: { label: 'Proposal', color: 'bg-orange-100 text-orange-800' },
  negotiation: { label: 'Negotiation', color: 'bg-pink-100 text-pink-800' },
  won: { label: 'Won', color: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800' },
}

export const DEAL_STAGE_CONFIG: Record<DealStage, { label: string; color: string; probability: number }> = {
  prospecting: { label: 'Prospecting', color: '#6366f1', probability: 10 },
  qualification: { label: 'Qualification', color: '#8b5cf6', probability: 25 },
  proposal: { label: 'Proposal', color: '#f59e0b', probability: 50 },
  negotiation: { label: 'Negotiation', color: '#f97316', probability: 75 },
  closed_won: { label: 'Closed Won', color: '#22c55e', probability: 100 },
  closed_lost: { label: 'Closed Lost', color: '#ef4444', probability: 0 },
}

export const PIPELINE_STAGES: DealStage[] = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
]

export const PLAN_LIMITS: Record<SubscriptionPlan, { leads: number; members: number }> = {
  free: { leads: 50, members: 1 },
  starter: { leads: 500, members: 5 },
  pro: { leads: Infinity, members: 25 },
  enterprise: { leads: Infinity, members: Infinity },
}
