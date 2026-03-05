import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types'

// Client-side Supabase client (use in components)
export const createBrowserClient = () =>
  createClientComponentClient<Database>()

// Server-side Supabase client (use in Server Components, Route Handlers)
export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies })

// Admin client with service role (use in API routes only — never expose to browser)
export const createAdminClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
