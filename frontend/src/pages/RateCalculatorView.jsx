import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, ArrowLeft } from 'lucide-react'
import { getRateCalculation, calculateRate } from '../lib/rateCalculationsApi'

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

export default function RateCalculatorView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const record = await getRateCalculation(id)
        if (!cancelled) setData(record)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load calculation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <div className="text-sm text-slate-400">Loading…</div>
  if (error) return <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded">{error}</div>
  if (!data) return null

  const results = calculateRate(data)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/rate-calculator')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-2"
          >
            <ArrowLeft size={13} />
            Back to Rate Calculator
          </button>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">{data.glass_name}</h1>
          <p className="text-sm text-slate-500">
            {data.products?.name ? `Linked to product: ${data.products.name}` : 'Not linked to a product'}
          </p>
        </div>
        <button
          onClick={() => navigate(`/rate-calculator/${id}`)}
          className="flex items-center gap-1.5 bg-brand-dark hover:bg-brand-mid text-white text-sm font-medium rounded-md px-4 py-2 transition-colors shrink-0"
        >
          <Pencil size={15} />
          Edit
        </button>
      </div>

      {/* Landed Total */}
      <Section title="Landed Total">
        <DetailRow label="MM (thickness)" value={data.mm} plain />
        <DetailRow label="Basic per MM (₹)" value={data.basic_per_mm} plain />
        <DetailRow label="Glass Basic" value={results.glassBasic} />
        <DetailRow label={`Energy Surcharge Rate (₹${data.energy_surcharge_rate}/mm)`} value={results.energySurcharge} />
        <DetailRow
          label={`Precious Metal Surcharge (₹${data.precious_metal_rate}/mm) ${
            data.include_precious_metal ? '' : '— not included'
          }`}
          value={results.preciousMetalSurcharge}
          muted={!data.include_precious_metal}
        />
        <DetailRow label="Fuel" value={Number(data.fuel) || 0} />
        <DetailRow label="Insurance" value={Number(data.insurance_landed) || 0} />
        <TotalRow label="Landed Total" value={results.landedTotal} />
      </Section>

      {/* Total 1 */}
      <Section title="Total 1">
        <DetailRow label={`Process Loss (${data.process_loss_pct}%)`} value={results.processLoss} />
        <DetailRow label={`Profit (${data.profit_pct}%)`} value={results.profit} />

        {data.combination_layers?.length > 0 && (
          <div className="py-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Glass Combination Layers
            </p>
            <div className="border border-slate-200 rounded overflow-hidden">
              {data.combination_layers.map((layer, i) => (
                <div
                  key={i}
                  className={[
                    'flex items-center justify-between px-3 py-2 text-sm',
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50',
                  ].join(' ')}
                >
                  <span className="text-slate-700">{layer.label}</span>
                  <span className="font-medium text-slate-800">₹{fmt(Number(layer.cost) || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <TotalRow label="Total 1" value={results.total1} />
      </Section>

      {/* Total 2 */}
      <Section title="Total 2">
        <DetailRow label="Freight" value={Number(data.freight) || 0} />
        <DetailRow label={`Insurance (${data.insurance_pct}%)`} value={results.insurance2} />
        <DetailRow label="Assessable Value" value={results.assessableValue} bold />
        <DetailRow label={`GST (${data.gst_pct}%)`} value={results.gst} />
        <TotalRow label="Total 2" value={results.total2} accent />
      </Section>

      {/* Rate Given */}
      <div className="bg-white border-2 border-brand-dark rounded-lg p-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Rate Given (final quoting rate)</span>
        <span className="text-2xl font-bold text-brand-dark">
          {data.rate_given != null ? `₹${fmt(Number(data.rate_given))}` : '—'}
        </span>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </div>
  )
}

function DetailRow({ label, value, bold, muted, plain }) {
  return (
    <div className={['flex items-center justify-between py-2', muted ? 'opacity-60' : ''].join(' ')}>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={['text-sm', bold ? 'font-semibold text-slate-800' : 'text-slate-700'].join(' ')}>
        {plain ? value : `₹${fmt(value)}`}
      </dd>
    </div>
  )
}

function TotalRow({ label, value, accent }) {
  return (
    <div
      className={[
        'flex items-center justify-between rounded px-3 py-2.5 mt-2',
        accent ? 'bg-brand-dark' : 'bg-brand-bg',
      ].join(' ')}
    >
      <span className={['font-semibold', accent ? 'text-white' : 'text-brand-dark'].join(' ')}>
        {label}
      </span>
      <span className={['font-bold', accent ? 'text-white text-base' : 'text-brand-dark'].join(' ')}>
        ₹{fmt(value)}
      </span>
    </div>
  )
}
