import Link from 'next/link'
import { Bot, Zap, Shield, BarChart2, Users, Kanban, ArrowRight, Check } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">AI Company Box</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/auth/signup" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            AI-powered CRM for modern sales teams
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Close more deals with{' '}
            <span className="text-indigo-600">your own AI</span>{' '}
            sales platform
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            AI Company Box gives you leads management, visual pipeline, Stripe billing, and multi-tenant isolation — ready to deploy in minutes.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/auth/signup" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg shadow-indigo-100">
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium px-4 py-3.5">See features →</Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">No credit card required · 14-day free trial</p>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-gray-900">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs text-gray-400 font-mono">app.aicompanybox.com/dashboard</span>
            </div>
            <div className="aspect-video bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="grid grid-cols-4 gap-4 mb-6 px-8">
                  {[['24', 'Leads'], ['$128K', 'Pipeline'], ['$47K', 'Revenue'], ['68%', 'Conversion']].map(([v, l]) => (
                    <div key={l} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-2xl font-bold text-white">{v}</p>
                      <p className="text-xs text-gray-400 mt-1">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 px-8 justify-center">
                  {['Prospecting', 'Qualification', 'Proposal', 'Negotiation'].map((s, i) => (
                    <div key={s} className="bg-white/5 border border-white/10 rounded-lg p-3 w-32">
                      <p className="text-xs text-gray-400 mb-2">{s}</p>
                      <div className="space-y-1.5">
                        {Array.from({ length: i + 1 }).map((_, j) => (
                          <div key={j} className="h-8 bg-white/10 rounded-md" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to run your sales</h2>
            <p className="text-lg text-gray-500">Built with Next.js 14, Supabase, Stripe — deployed on Vercel in one click.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Lead Management', desc: 'Capture, track, and qualify leads with a powerful table view, filters, and full CRUD operations.' },
              { icon: Kanban, title: 'Pipeline Kanban', desc: 'Drag-and-drop deals through customizable stages. See pipeline value and probability at a glance.' },
              { icon: Shield, title: 'Multi-tenant RLS', desc: 'Complete tenant isolation via Supabase Row Level Security. Each workspace is fully siloed.' },
              { icon: Zap, title: 'Stripe Billing', desc: 'Free/Starter/Pro/Enterprise plans with Stripe Checkout, webhooks, and billing portal built in.' },
              { icon: BarChart2, title: 'Dashboard Analytics', desc: 'Real-time stats: revenue closed, pipeline value, conversion rate, and lead velocity.' },
              { icon: Bot, title: 'Auth (Email + Google)', desc: 'Sign up with email/password or Google OAuth. Auto-creates tenant and profile on first login.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to build your AI company?</h2>
          <p className="text-indigo-200 mb-8">Deploy to Vercel in under 5 minutes. Free forever on the starter plan.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-lg">
            Get started free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">AI Company Box</span>
          </div>
          <p className="text-sm text-gray-400">Built with Next.js · Supabase · Stripe · Vercel</p>
        </div>
      </footer>
    </div>
  )
}
