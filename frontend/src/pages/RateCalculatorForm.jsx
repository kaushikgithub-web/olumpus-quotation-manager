import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, ArrowRight } from 'lucide-react'
import {
  getRateCalculation,
  createRateCalculation,
  updateRateCalculation,
  calculateRate,
  pushRateToProduct,
} from '../lib/rateCalculationsApi'
import ProductAutocomplete from '../components/ProductAutocomplete'

const emptyLayer = () => ({ label: '', cost: '' })

const emptyForm = {
  glass_name: '',
  product_id: null,
  mm: '',
  basic_per_mm: '',
  energy_surcharge_rate: '',
  precious_metal_rate: '',
  include_precious_metal: false,
  fuel: '',
  insurance_landed: '',
  process_loss_pct: 3,
  profit_pct: 3,
  combination_layers: [emptyLayer()],
  freight: '',
  insurance_pct: 2,
  gst_pct: 18,
  rate_given: '',
}

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

export default function RateCalculatorForm() {
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [productName, setProductName] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [error, setError] = useState('')
  const [pushedMessage, setPushedMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      setError('')
      try {
        if (isEditMode) {
          const data = await getRateCalculation(id)
          if (cancelled) return
          setForm({
            ...data,
            combination_layers:
              data.combination_layers?.length > 0 ? data.combination_layers : [emptyLayer()],
          })
          if (data.products?.name) {
            setProductName(data.products.name)
            setSelectedProduct({ id: data.product_id, name: data.products.name })
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [id, isEditMode])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateLayer(index, patch) {
    setForm((prev) => ({
      ...prev,
      combination_layers: prev.combination_layers.map((l, i) =>
        i === index ? { ...l, ...patch } : l
      ),
    }))
  }

  function addLayer() {
    setForm((prev) => ({
      ...prev,
      combination_layers: [...prev.combination_layers, emptyLayer()],
    }))
  }

  function removeLayer(index) {
    setForm((prev) => ({
      ...prev,
      combination_layers: prev.combination_layers.filter((_, i) => i !== index),
    }))
  }

  const results = calculateRate(form)

  async function handleSave() {
    setError('')
    if (!form.glass_name.trim()) {
      setError('Glass name is required.')
      return
    }
    if (form.combination_layers.some((l) => !l.label.trim() && Number(l.cost) > 0)) {
      setError('One of your glass combination layers has a cost but no name. Please name it before saving.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        mm: Number(form.mm) || 0,
        basic_per_mm: Number(form.basic_per_mm) || 0,
        energy_surcharge_rate: Number(form.energy_surcharge_rate) || 0,
        precious_metal_rate: Number(form.precious_metal_rate) || 0,
        fuel: Number(form.fuel) || 0,
        insurance_landed: Number(form.insurance_landed) || 0,
        process_loss_pct: Number(form.process_loss_pct) || 0,
        profit_pct: Number(form.profit_pct) || 0,
        freight: Number(form.freight) || 0,
        insurance_pct: Number(form.insurance_pct) || 0,
        gst_pct: Number(form.gst_pct) || 0,
        rate_given: form.rate_given === '' ? null : Number(form.rate_given),
        combination_layers: form.combination_layers
          .filter((l) => l.label.trim() || Number(l.cost) > 0)
          .map((l) => ({ label: l.label.trim(), cost: Number(l.cost) || 0 })),
      }
      delete payload.products // strip the joined relation before writing back

      if (isEditMode) {
        await updateRateCalculation(id, payload, { product: selectedProduct, productName })
      } else {
        await createRateCalculation(payload, {
          product: selectedProduct,
          productName,
        })
      }
      navigate('/rate-calculator')
    } catch (err) {
      setError(err.message || 'Failed to save calculation.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePushToProduct() {
    const productId = selectedProduct?.id || form.product_id
    if (!productId || form.rate_given === '') return
    setPushing(true)
    setError('')
    setPushedMessage('')
    try {
      await pushRateToProduct(productId, Number(form.rate_given))
      setPushedMessage(`Rate ₹${form.rate_given} pushed to "${productName}" in Product Master.`)
    } catch (err) {
      setError(err.message || 'Failed to push rate to product.')
    } finally {
      setPushing(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-400">Loading…</div>
  }

  const inputClass =
    'w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light'
  const labelClass = 'block text-xs font-medium text-slate-500 mb-1'
  const canPush = Boolean(selectedProduct?.id || form.product_id) && form.rate_given !== ''

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">
            {isEditMode ? 'Edit Calculation' : 'New Rate Calculation'}
          </h1>
          <p className="text-sm text-slate-500">
            Work out a sell rate from raw glass cost + surcharges + combination layers.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-brand-dark hover:bg-brand-mid text-white text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-60"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}
      {pushedMessage && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded mb-4">
          {pushedMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* LEFT COLUMN: all inputs */}
        <div className="space-y-5">
          {/* Glass identity */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <label className={labelClass}>Glass Name (this calculation's label)</label>
            <input
              type="text"
              value={form.glass_name}
              onChange={(e) => set('glass_name', e.target.value)}
              placeholder="e.g. KT755"
              className={`${inputClass} mb-3`}
            />
            <label className={labelClass}>
              Product (type any name — existing or brand new)
            </label>
            <ProductAutocomplete
              value={productName}
              onChange={setProductName}
              onSelectProduct={setSelectedProduct}
            />
            <p className="text-xs text-slate-400 mt-1.5">
              {selectedProduct
                ? `Linked to existing product "${selectedProduct.name}".`
                : productName.trim()
                ? `"${productName}" will be created as a new product in Product Master when you save.`
                : 'Optional — link this calculation to a product so you can push the rate to it later.'}
            </p>
          </div>

          {/* Landed Total inputs — laid out row-by-row like the spreadsheet,
              so Glass Basic gets its own clear row right after Basic per MM,
              not buried as small helper text. */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Stage 1 — Landed Total
            </h3>

            <div className="divide-y divide-slate-100">
              <FieldRow label="MM (thickness)">
                <input type="number" step="0.01" value={form.mm} onChange={(e) => set('mm', e.target.value)} className={inputClass} />
              </FieldRow>

              <FieldRow label="Basic per MM (₹)">
                <input type="number" step="0.01" value={form.basic_per_mm} onChange={(e) => set('basic_per_mm', e.target.value)} className={inputClass} />
              </FieldRow>

              <ComputedRow label="Glass Basic" sublabel="= Basic per MM × MM" value={results.glassBasic} />

              <FieldRow label="Energy Surcharge Rate (₹/mm)">
                <input type="number" step="0.01" value={form.energy_surcharge_rate} onChange={(e) => set('energy_surcharge_rate', e.target.value)} className={inputClass} />
              </FieldRow>
              <ComputedRow label="Energy Surcharge" sublabel="= Rate × MM" value={results.energySurcharge} />

              <FieldRow label="Precious Metal Rate (₹/mm)">
                <input type="number" step="0.01" value={form.precious_metal_rate} onChange={(e) => set('precious_metal_rate', e.target.value)} className={inputClass} />
              </FieldRow>
              <ComputedRow
                label="Precious Metal Surcharge"
                sublabel={form.include_precious_metal ? 'Included in Landed Total below' : 'NOT included in Landed Total below'}
                value={results.preciousMetalSurcharge}
                muted={!form.include_precious_metal}
              />
              <div className="py-2.5">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.include_precious_metal}
                    onChange={(e) => set('include_precious_metal', e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Include Precious Metal Surcharge in Landed Total
                </label>
              </div>

              <FieldRow label="Fuel (₹, manual)">
                <input type="number" step="0.01" value={form.fuel} onChange={(e) => set('fuel', e.target.value)} className={inputClass} />
              </FieldRow>

              <FieldRow label="Insurance (₹, manual)">
                <input type="number" step="0.01" value={form.insurance_landed} onChange={(e) => set('insurance_landed', e.target.value)} className={inputClass} />
              </FieldRow>
            </div>

            <div className="mt-3 bg-brand-dark rounded px-3 py-2.5 flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Landed Total</span>
              <span className="font-bold text-white text-base">₹{fmt(results.landedTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className={labelClass}>Process Loss %</label>
                <input type="number" step="0.01" value={form.process_loss_pct} onChange={(e) => set('process_loss_pct', e.target.value)} className={inputClass} />
                <p className="text-xs text-slate-400 mt-1">= ₹{fmt(results.processLoss)}</p>
              </div>
              <div>
                <label className={labelClass}>Profit %</label>
                <input type="number" step="0.01" value={form.profit_pct} onChange={(e) => set('profit_pct', e.target.value)} className={inputClass} />
                <p className="text-xs text-slate-400 mt-1">= ₹{fmt(results.profit)}</p>
              </div>
            </div>
          </div>

          {/* Combination layers */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">
              Stage 2 — Glass Combination Layers
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Added on top of Landed Total + Process Loss + Profit to make Total 1 below.
            </p>
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={addLayer}
                className="flex items-center gap-1 text-xs text-brand-dark hover:text-brand-mid font-medium"
              >
                <Plus size={13} />
                Add layer
              </button>
            </div>
            <div className="grid grid-cols-[minmax(220px,1fr)_100px_32px] gap-2 mb-2">
  <span className="text-xs font-medium text-slate-500">
    Layer name
  </span>
  <span className="text-xs font-medium text-slate-500 text-center">
    Cost (₹)
  </span>
  <span />
</div>
            <div className="space-y-2">
              {form.combination_layers.map((layer, i) => (
                <div
  key={i}
  className="grid grid-cols-[minmax(220px,1fr)_100px_32px] gap-2 items-center"
>
                  <input
                    type="text"
                    value={layer.label}
                    onChange={(e) => updateLayer(i, { label: e.target.value })}
                    placeholder="e.g. Tempering"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={layer.cost}
                    onChange={(e) => updateLayer(i, { cost: e.target.value })}
                    placeholder="0.00"
                    className={`${inputClass} w-full text-center`}
                  />
                  <button
                    onClick={() => removeLayer(i)}
                    className="flex justify-center items-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {form.combination_layers.some((l) => !l.label.trim() && Number(l.cost) > 0) && (
              <p className="text-xs text-amber-600 mt-2">
                A layer has a cost but no name — give it a name or it won't be saved.
              </p>
            )}
            <div className="mt-3 bg-brand-bg rounded px-3 py-2 text-sm flex items-center justify-between">
              <span className="font-medium text-slate-600">
                Landed Total + Process Loss + Profit + Layers =
              </span>
              <span className="font-semibold text-brand-dark">₹{fmt(results.total1)}</span>
            </div>
          </div>

          {/* Total 2 inputs */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Stage 3 — Freight, Insurance &amp; GST
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Freight (₹)</label>
                <input type="number" step="0.01" value={form.freight} onChange={(e) => set('freight', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Insurance %</label>
                <input type="number" step="0.01" value={form.insurance_pct} onChange={(e) => set('insurance_pct', e.target.value)} className={inputClass} />
                <p className="text-xs text-slate-400 mt-1">= ₹{fmt(results.insurance2)}</p>
              </div>
              <div>
                <label className={labelClass}>GST %</label>
                <input type="number" step="0.01" value={form.gst_pct} onChange={(e) => set('gst_pct', e.target.value)} className={inputClass} />
                <p className="text-xs text-slate-400 mt-1">= ₹{fmt(results.gst)}</p>
              </div>
            </div>
            <div className="mt-3 bg-brand-bg rounded px-3 py-2 text-sm flex items-center justify-between">
              <span className="font-medium text-slate-600">Total 1 + Freight + Insurance + GST =</span>
              <span className="font-semibold text-brand-dark">₹{fmt(results.total2)}</span>
            </div>
          </div>

          {/* Rate given */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <label className={labelClass}>Rate Given (₹) — your final quoting rate</label>
            <input
              type="number"
              step="0.01"
              value={form.rate_given}
              onChange={(e) => set('rate_given', e.target.value)}
              placeholder={fmt(results.total2)}
              className={inputClass}
            />
            {(selectedProduct || form.product_id) && (
              <button
                onClick={handlePushToProduct}
                disabled={pushing || !canPush}
                className="flex items-center gap-1.5 mt-3 text-sm text-brand-dark hover:text-brand-mid font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight size={15} />
                {pushing ? 'Pushing…' : 'Push this rate to the linked product'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: live results, read-only */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 h-fit sticky top-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Live Calculation</h3>

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Landed Total
          </p>
          <dl className="space-y-2 text-sm mb-3">
            <Row label="Glass Basic" value={results.glassBasic} />
            <Row label="Energy Surcharge" value={results.energySurcharge} />
            <Row
              label={`Precious Metal Surcharge ${form.include_precious_metal ? '' : '(not included)'}`}
              value={results.preciousMetalSurcharge}
              muted={!form.include_precious_metal}
            />
            <Row label="Fuel" value={Number(form.fuel) || 0} />
            <Row label="Insurance" value={Number(form.insurance_landed) || 0} />
          </dl>
          <div className="bg-brand-bg rounded px-3 py-2 flex items-center justify-between text-sm mb-4">
            <span className="font-semibold text-brand-dark">Landed Total</span>
            <span className="font-semibold text-brand-dark">₹{fmt(results.landedTotal)}</span>
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Total 1
          </p>
          <dl className="space-y-2 text-sm mb-3">
            <Row label={`Process Loss (${form.process_loss_pct}%)`} value={results.processLoss} />
            <Row label={`Profit (${form.profit_pct}%)`} value={results.profit} />
            <Row label="Combination Layers" value={results.layersTotal} />
          </dl>
          <div className="bg-brand-bg rounded px-3 py-2 flex items-center justify-between text-sm mb-4">
            <span className="font-semibold text-brand-dark">Total 1</span>
            <span className="font-semibold text-brand-dark">₹{fmt(results.total1)}</span>
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Total 2
          </p>
          <dl className="space-y-2 text-sm mb-3">
            <Row label="Freight" value={Number(form.freight) || 0} />
            <Row label={`Insurance (${form.insurance_pct}%)`} value={results.insurance2} />
            <Row label="Assessable Value" value={results.assessableValue} bold />
            <Row label={`GST (${form.gst_pct}%)`} value={results.gst} />
          </dl>
          <div className="bg-brand-dark rounded px-3 py-2.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-white">Total 2</span>
            <span className="font-bold text-white text-base">₹{fmt(results.total2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div className="py-2.5 flex items-center justify-between gap-4">
      <span className="text-sm text-slate-600 shrink-0">{label}</span>
      <div className="w-36">{children}</div>
    </div>
  )
}

function ComputedRow({ label, sublabel, value, muted }) {
  return (
    <div
      className={[
        'py-2.5 flex items-center justify-between gap-4',
        muted ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      </div>
      <span className="text-sm font-semibold text-brand-dark w-36 text-right">
        ₹{fmt(value)}
      </span>
    </div>
  )
}

function Row({ label, value, bold, muted }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? 'text-slate-400' : 'text-slate-500'}>{label}</dt>
      <dd className={[bold ? 'font-semibold' : 'font-normal', muted ? 'text-slate-400' : 'text-slate-700'].join(' ')}>
        ₹{fmt(value)}
      </dd>
    </div>
  )
}
