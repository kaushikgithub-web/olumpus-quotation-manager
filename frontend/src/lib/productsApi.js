import { supabase } from './supabaseClient'

/**
 * Thin wrapper around the `products` table. Keeping these calls in one
 * place (rather than scattered inline in components) means when Phase 7
 * (New Quotation) needs "fetch a product to auto-fill a line item," it
 * reuses `listProducts`/`getProduct` instead of duplicating the query.
 */

export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/** Case-insensitive search, used by ProductAutocomplete (Rate Calculator). */
export async function searchProducts(query) {
  if (!query || !query.trim()) return []

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${query.trim()}%`)
    .order('name', { ascending: true })
    .limit(8)

  if (error) throw error
  return data
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
