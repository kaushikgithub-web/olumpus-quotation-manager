import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at startup rather than silently returning empty data later —
  // much easier to debug than a mysterious blank dashboard.
  throw new Error(
    'Missing Supabase env vars. Check that frontend/.env has VITE_SUPABASE_URL ' +
      'and VITE_SUPABASE_ANON_KEY set, then restart the dev server.'
  )
}

// Uses the ANON key only — safe to expose in browser code. Row Level
// Security policies (see docs/sql/003_rls_policies.sql) control what this
// client can actually read/write.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
