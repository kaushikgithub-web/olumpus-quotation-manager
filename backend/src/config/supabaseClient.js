import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase env vars. Check that backend/.env has SUPABASE_URL ' +
      'and SUPABASE_SERVICE_ROLE_KEY set.'
  )
}

// Uses the SERVICE_ROLE key — this BYPASSES Row Level Security entirely.
// Never send this key to the frontend or commit it to git. It's used here
// for privileged server-side operations like atomic reference-number
// generation and (later) admin-only writes.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
