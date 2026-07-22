import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { supabaseAdmin } from '../config/supabaseClient.js'
import { renderQuotationHtml } from '../utils/renderQuotationHtml.js'
import { generatePdfBuffer } from '../utils/pdfGenerator.js'

const router = Router()

/**
 * POST /api/quotations/next-reference-number
 *
 * Reference numbers MUST be generated here, not from the frontend directly.
 * The `reference_counter` table has no RLS policy at all (see
 * docs/sql/003_rls_policies.sql) — that's intentional, so only this
 * service-role-backed endpoint can touch it. This guarantees the counter
 * can never be read or incremented by anything except this one code path.
 */
router.post('/next-reference-number', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('generate_reference_number')
    if (error) throw error
    res.json({ reference_number: data })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/quotations/:id/pdf
 *
 * Generates the quotation PDF on demand (not stored — always rendered fresh
 * from current data, so editing a quotation and re-downloading always
 * reflects the latest version).
 *
 * IMPORTANT: this uses the service_role key, which BYPASSES Row Level
 * Security entirely — that's necessary here to fetch company settings in
 * the same request, but it means the ownership check RLS normally handles
 * automatically (see docs/sql/008_quotation_ownership.sql) does NOT apply
 * to this route on its own. We check it explicitly below: the requester
 * must either be the quotation's creator, or hold the "owner" (MD) role.
 * Without this check, any logged-in staff user could download ANY
 * quotation's PDF just by knowing its id — defeating the whole point of
 * per-user visibility.
 */
router.get('/:id/pdf', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const [
      { data: quotation, error: qError },
      { data: items, error: iError },
      { data: settings, error: sError },
      { data: roleRow, error: rError },
    ] = await Promise.all([
      supabaseAdmin.from('quotations').select('*, clients(*)').eq('id', id).single(),
      supabaseAdmin
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id)
        .order('sno', { ascending: true }),
      supabaseAdmin.from('settings').select('*').eq('id', 1).single(),
      supabaseAdmin.from('user_roles').select('role').eq('user_id', req.user.id).maybeSingle(),
    ])

    if (qError) throw qError
    if (iError) throw iError
    if (sError) throw sError
    if (rError) throw rError

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' })
    }

    const isOwner = roleRow?.role === 'owner'
    const isCreator = quotation.created_by_id === req.user.id

    if (!isOwner && !isCreator) {
      return res.status(403).json({
        error: 'You do not have permission to view this quotation.',
      })
    }

    const html = renderQuotationHtml({
      quotation,
      client: quotation.clients,
      items,
      settings,
    })

    const pdfBuffer = await generatePdfBuffer(html)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${quotation.reference_number.replace(/\//g, '-')}.pdf"`
    )
    res.send(pdfBuffer)
  } catch (err) {
    next(err)
  }
})

export default router
