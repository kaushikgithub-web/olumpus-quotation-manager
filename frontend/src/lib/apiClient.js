import { supabase } from './supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

/**
 * Calls the Express backend (used only for things that need the
 * service_role key — currently just reference number generation and PDF
 * generation). Automatically attaches the current user's Supabase session
 * token so the backend's requireAuth middleware can verify who's asking.
 */
export async function apiFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }

  return res.json()
}

/**
 * Same as apiFetch, but for binary responses (PDFs) — returns a Blob
 * instead of parsing JSON.
 */
export async function apiFetchBlob(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }

  return res.blob()
}
