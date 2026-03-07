'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn, formatCurrency, DEAL_STAGE_CONFIG, PIPELINE_STAGES } from '@/lib/utils'
import { Plus, Loader2, X, GripVertical, DollarSign } from 'lucide-react'
import type { Deal, DealStage } from '@/types'

interface DealFormData {
  title: string
  value: string
  stage: DealStage
  probability: string
  expected_close_date: string
  notes: string
}

const EMPTY_FORM: DealFormData = {
  title: '', value: '', stage: 'prospecting', probability: '10', expected_close_date: '', notes: '',
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [form, setForm] = useState<DealFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<DealStage | null>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tid = data?.tenant_id
    setTenantId(tid ?? null)
    if (tid) {
      const { data: dealsData } = await supabase.from('deals').select('*').eq('tenant_id', tid).order('position')
      setDeals(dealsData ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { init() }, [init])

  const getDealsByStage = (stage: DealStage) => deals.filter(d => d.stage === stage)
  const getStageTotal = (stage: DealStage) => getDealsByStage(stage).reduce((s, d) => s + (d.value ?? 0), 0)

  const openAdd = (stage: DealStage = 'prospecting') => {
    setEditDeal(null)
    setForm({ ...EMPTY_FORM, stage, probability: String(DEAL_STAGE_CONFIG[stage].probability) })
    setShowModal(true)
  }
  const openEdit = (deal: Deal) => {
    setEditDeal(deal)
    setForm({
      title: deal.title, value: deal.value?.toString() ?? '',
      stage: deal.stage, probability: deal.probability?.toString() ?? '',
      expected_close_date: deal.expected_close_date ?? '', notes: deal.notes ?? '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)
    const payload = {
      ...form, value: parseFloat(form.value) || 0, probability: parseInt(form.probability) || 0, tenant_id: tenantId,
      position: getDealsByStage(form.stage).length,
    }
    const { error } = editDeal
      ? await supabase.from('deals').update(payload).eq('id', editDeal.id)
      : await supabase.from('deals').insert(payload)
    setSaving(false)
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
    else { toast({ title: editDeal ? 'Deal updated' : 'Deal added!' }); setShowModal(false); init() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').delete().eq('id', id)
    toast({ title: 'Deal deleted' })
    init()
  }

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDragging(dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault()
    if (!dragging) return
    const deal = deals.find(d => d.id === dragging)
    if (!deal || deal.stage === targetStage) { setDragging(null); setDragOver(null); return }

    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dragging ? { ...d, stage: targetStage } : d))
    await supabase.from('deals').update({ stage: targetStage, probability: DEAL_STAGE_CONFIG[targetStage].probability }).eq('id', dragging)
    setDragging(null)
    setDragOver(null)
  }

  const f = (key: keyof DealFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  )

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span><strong className="text-gray-900">{deals.length}</strong> deals</span>
          <span><strong className="text-gray-900">{formatCurrency(deals.reduce((s, d) => s + (d.value ?? 0), 0))}</strong> total value</span>
        </div>
        <Button onClick={() => openAdd()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1.5" /> Add Deal
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin -mx-6 px-6">
        {PIPELINE_STAGES.map((stage) => {
          const config = DEAL_STAGE_CONFIG[stage]
          const stageDeals = getDealsByStage(stage)
          const isOver = dragOver === stage

          return (
            <div
              key={stage}
              className={cn(
                'flex-shrink-0 w-72 flex flex-col rounded-xl border-2 transition-colors',
                isOver ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-gray-50/50'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(stage) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-sm font-semibold text-gray-800">{config.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">{stageDeals.length}</span>
                  </div>
                </div>
                {getStageTotal(stage) > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(getStageTotal(stage))}</p>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-2 min-h-[200px]">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null) }}
                    className={cn(
                      'bg-white rounded-lg border border-gray-200 p-3 kanban-card hover:shadow-md transition-all group',
                      dragging === deal.id && 'opacity-40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5 group-hover:text-gray-400" />
                        <button onClick={() => openEdit(deal)} className="text-sm font-medium text-gray-900 text-left hover:text-indigo-600 transition-colors leading-snug">
                          {deal.title}
                        </button>
                      </div>
                    </div>
                    {deal.value > 0 && (
                      <div className="flex items-center gap-1 mt-2 ml-5">
                        <DollarSign className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-semibold text-green-700">{formatCurrency(deal.value)}</span>
                      </div>
                    )}
                    {deal.probability > 0 && deal.probability < 100 && (
                      <div className="mt-2 ml-5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Probability</span>
                          <span className="text-xs font-medium text-gray-600">{deal.probability}%</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${deal.probability}%`, backgroundColor: config.color }}
                          />
                        </div>
                      </div>
                    )}
                    {deal.expected_close_date && (
                      <p className="text-xs text-gray-400 mt-2 ml-5">
                        Close: {new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2 ml-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(deal)} className="text-xs text-indigo-500 hover:text-indigo-700">Edit</button>
                      <span className="text-gray-300">·</span>
                      <button onClick={() => handleDelete(deal.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => openAdd(stage)}
                  className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 rounded-lg hover:bg-white border border-dashed border-gray-200 hover:border-gray-300 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add deal
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editDeal ? 'Edit Deal' : 'Add Deal'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Deal title *</Label>
                <Input value={form.title} onChange={f('title')} required placeholder="e.g. Acme Corp — Enterprise Plan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Value ($)</Label>
                  <Input type="number" min="0" value={form.value} onChange={f('value')} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Probability (%)</Label>
                  <Input type="number" min="0" max="100" value={form.probability} onChange={f('probability')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Stage</Label>
                  <select value={form.stage} onChange={f('stage')} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {PIPELINE_STAGES.map(s => <option key={s} value={s}>{DEAL_STAGE_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Close date</Label>
                  <Input type="date" value={form.expected_close_date} onChange={f('expected_close_date')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <textarea value={form.notes} onChange={f('notes')} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" placeholder="Deal notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editDeal ? 'Save Changes' : 'Add Deal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
