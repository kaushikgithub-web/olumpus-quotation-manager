import { supabase } from './supabaseClient'
import { updateProduct, createProduct } from './productsApi'

/**
 * Pure calculation function — mirrors the spreadsheet's formula chain
 * exactly, confirmed against the original worksheet:
 *   Glass Basic = basicPerMm × mm
 *   Energy Surcharge = energySurchargeRate × mm
 *   Precious Metal Surcharge = preciousMetalRate × mm (only added to Landed
 *     Total when includePreciousMetal is true — it varies by combination)
 *   Landed Total = Glass Basic + Energy Surcharge + Fuel + Insurance(landed)
 *     [+ Precious Metal Surcharge, if included]
 *   Process Loss = processLossPct% × Landed Total
 *   Profit = profitPct% × Landed Total
 *   Total 1 = Landed Total + Process Loss + Profit + sum(combination layers)
 *   Insurance (2nd) = insurancePct% × (Total 1 + Freight)
 *   Assessable Value = Total 1 + Freight + Insurance(2nd)
 *   GST = gstPct% × Assessable Value
 *   Total 2 = Assessable Value + GST
 *
 * Kept as a standalone export (not buried in a component) so the same
 * math can be unit-tested or reused anywhere without touching React.
 */
export function calculateRate(inputs) {
  const mm = Number(inputs.mm) || 0
  const basicPerMm = Number(inputs.basic_per_mm) || 0
  const energySurchargeRate = Number(inputs.energy_surcharge_rate) || 0
  const preciousMetalRate = Number(inputs.precious_metal_rate) || 0
  const fuel = Number(inputs.fuel) || 0
  const insuranceLanded = Number(inputs.insurance_landed) || 0
  const processLossPct = Number(inputs.process_loss_pct) || 0
  const profitPct = Number(inputs.profit_pct) || 0
  const freight = Number(inputs.freight) || 0
  const insurancePct = Number(inputs.insurance_pct) || 0
  const gstPct = Number(inputs.gst_pct) || 0
  const layers = inputs.combination_layers || []

  const glassBasic = basicPerMm * mm
  const energySurcharge = energySurchargeRate * mm
  const preciousMetalSurcharge = preciousMetalRate * mm

  const landedTotal =
    glassBasic +
    energySurcharge +
    fuel +
    insuranceLanded +
    (inputs.include_precious_metal ? preciousMetalSurcharge : 0)

  const processLoss = (processLossPct / 100) * landedTotal
  const profit = (profitPct / 100) * landedTotal

  const layersTotal = layers.reduce((sum, l) => sum + (Number(l.cost) || 0), 0)

  const total1 = landedTotal + processLoss + profit + layersTotal

  const insurance2 = (insurancePct / 100) * (total1 + freight)
  const assessableValue = total1 + freight + insurance2
  const gst = (gstPct / 100) * assessableValue
  const total2 = assessableValue + gst

  return {
    glassBasic,
    energySurcharge,
    preciousMetalSurcharge,
    landedTotal,
    processLoss,
    profit,
    layersTotal,
    total1,
    insurance2,
    assessableValue,
    gst,
    total2,
  }
}

export async function listRateCalculations() {
  const { data, error } = await supabase
    .from('rate_calculations')
    .select('*, products(name)')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getRateCalculation(id) {
  const { data, error } = await supabase
    .from('rate_calculations')
    .select('*, products(id, name)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * `product` is either a full product record (from ProductAutocomplete's
 * onSelectProduct) or null, meaning: create a new Product Master entry
 * from `productName` first, then link to that. This is what lets the
 * calculator accept ANY product name, not just ones that already exist.
 */
export async function createRateCalculation(fields, { product, productName } = {}) {
  let productId = product?.id || fields.product_id || null

  if (!productId && productName?.trim()) {
    const newProduct = await createProduct({ name: productName.trim() })
    productId = newProduct.id
  }

  const payload = { ...fields, product_id: productId }
  const results = calculateRate(payload)
  const { data, error } = await supabase
    .from('rate_calculations')
    .insert({ ...payload, total2_snapshot: results.total2 })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRateCalculation(id, fields, { product, productName } = {}) {
  let productId = product?.id || fields.product_id || null

  if (!productId && productName?.trim()) {
    const newProduct = await createProduct({ name: productName.trim() })
    productId = newProduct.id
  }

  const payload = { ...fields, product_id: productId }
  const results = calculateRate(payload)
  const { data, error } = await supabase
    .from('rate_calculations')
    .update({ ...payload, total2_snapshot: results.total2 })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRateCalculation(id) {
  const { error } = await supabase.from('rate_calculations').delete().eq('id', id)
  if (error) throw error
}

/** Pushes a calculation's final Rate Given into a product's default_rate. */
export async function pushRateToProduct(productId, rate) {
  return updateProduct(productId, { default_rate: rate })
}
