import { supabase } from './supabaseClient'

/**
 * Thin wrapper around the `clients` table — same pattern as productsApi.js.
 * `searchClients` backs the autocomplete on the New Quotation page (Phase 7).
 */

export async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Case-insensitive "starts with or contains" search, used for autocomplete.
 * Limited to 8 results — a dropdown doesn't need more than that to be useful.
 */
export async function searchClients(query) {
  if (!query || !query.trim()) return []

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', `%${query.trim()}%`)
    .order('name', { ascending: true })
    .limit(8)

  if (error) throw error
  return data
}

export async function createClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}
