# 🤖 AI Company-in-a-Box

A complete multi-tenant SaaS boilerplate for building an AI company, featuring leads management, sales pipeline, Stripe billing, and full tenant isolation.

**Stack:** Next.js 14 · Supabase · Stripe · Tailwind CSS · shadcn/ui · Vercel

---

## ✨ Features

- **Auth** — Email/password + Google OAuth via Supabase Auth
- **Multi-tenancy** — Row Level Security (RLS) isolates each workspace's data
- **Leads Table** — Full CRUD with search, filters, and status tracking
- **Pipeline Kanban** — Drag-and-drop deals across 6 stages
- **Dashboard** — Stats, recent leads, pipeline summary
- **Settings** — Profile, workspace, and billing management
- **Stripe Billing** — Free/Starter/Pro/Enterprise plans with webhooks
- **Auto onboarding** — Tenant + subscription created automatically on signup

---

## 🚀 Quick Deploy (Vercel — 1-Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ai-company-box&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,STRIPE_SECRET_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_STARTER,STRIPE_PRICE_PRO,STRIPE_PRICE_ENTERPRISE&envDescription=See%20.env.example%20for%20details)

---

## 🛠️ Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ai-company-box
cd ai-company-box
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Authentication → Providers** and enable Google if desired
4. Copy your project URL and keys from **Settings → API**

### 3. Set up Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Create 3 products with monthly prices:
   - **Starter** — $29/month
   - **Pro** — $79/month
   - **Enterprise** — $199/month
3. Copy the **Price IDs** (start with `price_`)
4. Get your API keys from **Developers → API keys**

### 4. Configure environment

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 5. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Set up Stripe webhooks (local)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret and add to STRIPE_WEBHOOK_SECRET
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── layout.tsx                   # Root layout
│   ├── globals.css                  # Global styles
│   ├── auth/
│   │   ├── login/page.tsx           # Login
│   │   ├── signup/page.tsx          # Signup
│   │   └── callback/route.ts        # OAuth callback
│   ├── dashboard/
│   │   ├── layout.tsx               # Dashboard shell (sidebar + header)
│   │   ├── page.tsx                 # Overview stats
│   │   ├── leads/page.tsx           # Leads table
│   │   ├── pipeline/page.tsx        # Kanban board
│   │   └── settings/page.tsx        # Settings (profile, workspace, billing)
│   └── api/
│       ├── webhooks/stripe/route.ts # Stripe webhook handler
│       ├── stripe/checkout/route.ts # Create checkout session
│       └── stripe/portal/route.ts   # Billing portal
├── components/
│   ├── ui/                          # shadcn/ui components
│   └── dashboard/                   # Sidebar, header
├── lib/
│   ├── supabase.ts                  # Supabase client helpers
│   ├── stripe.ts                    # Stripe client + helpers
│   └── utils.ts                     # cn(), formatters, constants
├── types/index.ts                   # TypeScript types
└── middleware.ts                    # Auth + route protection
supabase/
└── migrations/001_initial_schema.sql # Full DB schema + RLS
```

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `tenants` | Workspace/organization |
| `profiles` | User profiles (linked to auth.users) |
| `subscriptions` | Stripe subscription state |
| `leads` | CRM leads |
| `deals` | Pipeline deals |
| `activities` | Audit log |

**Tenant isolation:** Every table has `tenant_id` with RLS policies that use the helper function `get_my_tenant_id()` to enforce data boundaries.

---

## 💳 Stripe Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription |
| `customer.subscription.updated` | Sync plan changes |
| `customer.subscription.deleted` | Downgrade to free |
| `invoice.paid` | Mark subscription active |
| `invoice.payment_failed` | Mark as past_due |

---

## 🔒 Security

- RLS enforces tenant isolation at the DB level — not just application code
- Service role key is never exposed to the browser
- Stripe webhook signature verification on every request
- Middleware protects all `/dashboard/*` routes

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email + Google) |
| Payments | Stripe |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Deployment | Vercel |
| Language | TypeScript |

---

## 📧 Support

Built as a production-ready boilerplate. Fork it, customize it, and ship your AI company!
