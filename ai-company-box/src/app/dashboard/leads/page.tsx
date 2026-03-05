'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn, formatCurrency, formatDate, LEAD_STATUS_CONFIG } from '@/lib/utils'
import { Plus, Search, Filter, Loader2, Mail, Phone, Building, ChevronDown, Trash2, Edit2, X } from 'lucide-react'
import type { Lead, LeadStatus, LeadSource } from '@/types'

const SOURCES: LeadSource[] = ['manual', 'website', 'referral', 'social', 'email', 'cold_outreach', 'other']
const STATUSES = Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]

interface LeadFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  title: string
  source: LeadSource
  status: LeadStatus
  value: string
  notes: string
}

const EMPTY_FORM: LeadFormData = {
  first_name: '', last_name: '', email: '', phone: '', company: '',
  title: '', source: 'manual', status: 'new', value: '', notes: '',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('')
  const [showModal, setShowModal] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [form, setForm] = useState<LeadFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const fetchTenantId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    setTenantId(data?.tenant_id ?? null)
    return data?.tenant_id
  }, [supabase])

  const fetchLeads = useCallback(async (tid?: string) => {
    const id = tid ?? tenantId
    if (!id) return
    setLoading(true)
    let query = supabase.from('leads').select('*').eq('tenant_id', id).order('created_at', { ascending: false })
    if (statusFilter) query = query.eq('status', statusFilter)
    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    const { data, error } = await query
    if (error) toast({ title: 'Error fetching leads', variant: 'destructive' })
    else setLeads(data ?? [])
    setLoading(false)
  }, [supabase, tenantId, statusFilter, search, toast])

  useEffect(() => {
    fetchTenantId().then(tid => fetchLeads(tid))
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [statusFilter, search])

  const openAdd = () => { setEditLead(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (lead: Lead) => {
    setEditLead(lead)
    setForm({
      first_name: lead.first_name, last_name: lead.last_name, email: lead.email,
      phone: lead.phone ?? '', company: lead.company ?? '', title: lead.title ?? '',
      source: lead.source, status: lead.status, value: lead.value?.toString() ?? '', notes: lead.notes ?? '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)
    const payload = {
      ...form,
      value: parseFloat(form.value) || 0,
      tenant_id: tenantId,
    }
    const { error } = editLead
      ? await supabase.from('leads').update(payload).eq('id', editLead.id)
      : await supabase.from('leads').insert(payload)
    setSaving(false)
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: editLead ? 'Lead updated' : 'Lead added!' })
      setShowModal(false)
      fetchLeads()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    else { toast({ title: 'Lead deleted' }); fetchLeads() }
  }

  const f = (key: keyof LeadFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="space-y-4 animate-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{LEAD_STATUS_CONFIG[s].label}</option>)}
        </select>
        <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 ml-auto">
          <Plus className="w-4 h-4 mr-1.5" /> Add Lead
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                </td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <p className="text-gray-400 text-sm">No leads found.</p>
                  <Button variant="link" className="text-indigo-600 mt-1" onClick={openAdd}>Add your first lead →</Button>
                </td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                          {lead.first_name?.[0]}{lead.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{lead.first_name} {lead.last_name}</p>
                          <p className="text-xs text-gray-400">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.company ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', LEAD_STATUS_CONFIG[lead.status]?.color)}>
                        {LEAD_STATUS_CONFIG[lead.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.value > 0 ? formatCurrency(lead.value) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{lead.source?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(lead)} className="h-7 w-7 p-0">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(lead.id)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {leads.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editLead ? 'Edit Lead' : 'Add Lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First name *</Label>
                  <Input value={form.first_name} onChange={f('first_name')} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name *</Label>
                  <Input value={form.last_name} onChange={f('last_name')} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={f('email')} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={f('phone')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Deal value ($)</Label>
                  <Input type="number" min="0" value={form.value} onChange={f('value')} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company</Label>
                  <Input value={form.company} onChange={f('company')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={f('title')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <select value={form.source} onChange={f('source')} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize">
                    {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select value={form.status} onChange={f('status')} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {STATUSES.map(s => <option key={s} value={s}>{LEAD_STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <textarea
                  value={form.notes}
                  onChange={f('notes')}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editLead ? 'Save Changes' : 'Add Lead'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
