import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

/**
 * Checks whether the current user has the "owner" role (see
 * docs/sql/008_quotation_ownership.sql). Used purely for UI messaging —
 * e.g. telling a staff user "you're seeing only your own quotations" — the
 * actual access restriction is enforced by Postgres Row Level Security
 * regardless of what this hook returns, so there's no security risk in
 * this being client-side.
 */
export function useUserRole() {
  const { session } = useAuth()
  const [role, setRole] = useState(null) // null = still loading
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!session?.user?.id) {
        setRole('staff')
        setLoading(false)
        return
      }
      setLoading(true)
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!cancelled) {
        setRole(data?.role || 'staff') // no row = ordinary staff, the safe default
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  return { role, isOwner: role === 'owner', loading }
}
