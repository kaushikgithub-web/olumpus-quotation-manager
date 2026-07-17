import { supabase } from './supabaseClient'
import { apiFetch, apiFetchBlob } from './apiClient'
import { createClient as createClientRecord } from './clientsApi'

/**
 * Fetches the next reference number from the backend (see architecture
 * note: this table has no RLS policy, so it MUST go through the backend's
 * service_role key, not a direct Supabase call from here).
 */
export async function deleteQuotation(id) {
  const { error } = await supabase.from('quotations').delete().eq('id', id)
  if (error) throw error
}
export async function getNextReferenceNumber() {
  const { reference_number } = await apiFetch('/api/quotations/next-reference-number', {
    method: 'POST',
  })
  return reference_number
}

/**
 * Fetches a quotation with its client and line items joined in, for the
 * "edit existing quotation" view.
 */
export async function getQuotation(id) {
  const { data: quotation, error: qError } = await supabase
    .from('quotations')
    .select('*, clients(*)')
    .eq('id', id)
    .single()

  if (qError) throw qError

  const { data: items, error: iError } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', id)
    .order('sno', { ascending: true })

  if (iError) throw iError

  return { quotation, items }
}

/**
 * Lists quotations with their client name joined in, newest first.
 * Optional filters match the search fields required for Quotation History:
 * client name, reference number, project name, exact date, and status.
 */
export async function listQuotations(filters = {}) {
  let query = supabase
    .from('quotations')
    .select('*, clients(name, company)')
    .order('created_at', { ascending: false })

  if (filters.referenceNumber) {
    query = query.ilike('reference_number', `%${filters.referenceNumber}%`)
  }
  if (filters.projectName) {
    query = query.ilike('project_name', `%${filters.projectName}%`)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.date) {
    query = query.eq('quotation_date', filters.date)
  }

  const { data, error } = await query
  if (error) throw error

  // Client name is filtered client-side after the join — Supabase's query
  // builder can't easily filter on a joined table's column with ilike
  // through the JS client without a separate RPC, and result sets here are
  // small enough (single-company tool) that this is simpler and fine.
  if (filters.clientName) {
    const q = filters.clientName.toLowerCase()
    return data.filter((row) => row.clients?.name?.toLowerCase().includes(q))
  }

  return data
}

/**
 * Creates a new quotation + its line items.
 *
 * `client` is either an existing client record (from ClientAutocomplete's
 * onSelectClient) or null (meaning: create a new client from `clientName`
 * first, then use that).
 */
export async function createQuotation({ quotation, items, client, clientName, companyName }) {
  let clientId = client?.id

  if (!clientId) {
    const newClient = await createClientRecord({
      name: clientName.trim(),
      company: companyName?.trim() || null,
    })
    clientId = newClient.id
  }

  const { data: created, error: qError } = await supabase
    .from('quotations')
    .insert({ ...quotation, client_id: clientId })
    .select()
    .single()

  if (qError) throw qError

  if (items.length > 0) {
    const { error: iError } = await supabase.from('quotation_items').insert(
      items.map((item, index) => ({
        quotation_id: created.id,
        product_id: item.product_id || null,
        sno: index + 1,
        description: item.description,
        rate: item.rate,
        unit: item.unit || null,
        quantity: item.quantity === '' ? null : item.quantity,
      }))
    )
    if (iError) throw iError
  }

  return created
}

/**
 * Updates an existing quotation. Line items are replaced wholesale
 * (delete-all-then-reinsert) rather than diffed row-by-row — simpler to
 * reason about correctly, and at this app's scale (a handful of line items
 * per quotation) the extra round trip costs nothing noticeable.
 */
export async function updateQuotation(id, { quotation, items, client, clientName, companyName }) {
  let clientId = client?.id

  if (!clientId) {
    const newClient = await createClientRecord({
      name: clientName.trim(),
      company: companyName?.trim() || null,
    })
    clientId = newClient.id
  }

  const { data: updated, error: qError } = await supabase
    .from('quotations')
    .update({ ...quotation, client_id: clientId })
    .eq('id', id)
    .select()
    .single()

  if (qError) throw qError

  const { error: delError } = await supabase
    .from('quotation_items')
    .delete()
    .eq('quotation_id', id)
  if (delError) throw delError

  if (items.length > 0) {
    const { error: iError } = await supabase.from('quotation_items').insert(
      items.map((item, index) => ({
        quotation_id: id,
        product_id: item.product_id || null,
        sno: index + 1,
        description: item.description,
        rate: item.rate,
        unit: item.unit || null,
        quantity: item.quantity === '' ? null : item.quantity,
      }))
    )
    if (iError) throw iError
  }

  return updated
}

/**
 * Duplicates an existing quotation: same client/items/terms, but a fresh
 * reference number and status reset to 'draft'. Returns the new quotation's
 * id so the caller can navigate straight into editing it.
 */
export async function duplicateQuotation(id) {
  const { quotation, items } = await getQuotation(id)
  const newReferenceNumber = await getNextReferenceNumber()

  const { data: created, error: qError } = await supabase
    .from('quotations')
    .insert({
      reference_number: newReferenceNumber,
      client_id: quotation.client_id,
      project_name: quotation.project_name,
      quotation_date: new Date().toISOString().slice(0, 10),
      validity_days: quotation.validity_days,
      gst_applicable: quotation.gst_applicable,
      remarks: quotation.remarks,
      status: 'draft',
    })
    .select()
    .single()

  if (qError) throw qError

  if (items.length > 0) {
    const { error: iError } = await supabase.from('quotation_items').insert(
      items.map((item) => ({
        quotation_id: created.id,
        product_id: item.product_id,
        sno: item.sno,
        description: item.description,
        rate: item.rate,
        unit: item.unit,
        quantity: item.quantity,
      }))
    )
    if (iError) throw iError
  }

  return created.id
}

/**
 * Fetches the quotation PDF and triggers a browser download. Also used by
 * the Print button (Phase 9) — opening the same blob in a new tab lets the
 * browser's native print dialog handle it.
 */
export async function downloadQuotationPdf(id, referenceNumber) {
  const blob = await apiFetchBlob(`/api/quotations/${id}/pdf`)
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${referenceNumber.replace(/\//g, '-')}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function printQuotationPdf(id, referenceNumber) {
  const blob = await apiFetchBlob(`/api/quotations/${id}/pdf`)
  const url = URL.createObjectURL(blob)

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.title = `Print ${referenceNumber}`
  iframe.src = url

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch {
      window.open(url, '_blank')
    }
  }

  document.body.appendChild(iframe)

  setTimeout(() => {
    document.body.removeChild(iframe)
    URL.revokeObjectURL(url)
  }, 60000)
}