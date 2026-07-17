import { useEffect, useState } from 'react'
import { Save, Calculator } from 'lucide-react'
import { listProducts, updateProduct } from '../lib/productsApi'

export default function RateMaster() {
  const [products, setProducts] = useState([])
  const [edits, setEdits] = useState({}) // { [productId]: newRateString }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      setProducts(await listProducts())
      setEdits({})
    } catch (err) {
      setError(err.message || 'Failed to load rates.')
    } finally {
      setLoading(false)
    }
  }

  function handleRateChange(id, value) {
    setEdits((prev) => ({ ...prev, [id]: value }))
  }

  const dirtyIds = Object.keys(edits).filter((id) => {
    const product = products.find((p) => p.id === id)
    const original = product?.default_rate ?? ''
    return String(edits[id]) !== String(original)
  })

  async function handleSaveAll() {
    setSaving(true)
    setError('')
    try {
      await Promise.all(
        dirtyIds.map((id) =>
          updateProduct(id, {
            default_rate: edits[id] === '' ? null : Number(edits[id]),
          })
        )
      )
      await refresh()
      setSavedAt(new Date())
    } catch (err) {
      setError(err.message || 'Failed to save some rates. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">Rate Master</h1>
          <p className="text-sm text-slate-500">
            Edit rates in bulk, then save all changes at once.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={dirtyIds.length === 0 || saving}
          className="flex items-center gap-1.5 bg-brand-dark hover:bg-brand-mid text-white text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Save size={16} />
          {saving
            ? 'Saving…'
            : dirtyIds.length > 0
            ? `Save ${dirtyIds.length} change${dirtyIds.length > 1 ? 's' : ''}`
            : 'Save changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {savedAt && dirtyIds.length === 0 && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded mb-4">
          Rates saved.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading rates…</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <Calculator className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">No products yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Add products from the Products page first.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium text-right w-40">Rate (₹)</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const value = edits[p.id] ?? p.default_rate ?? ''
                const isDirty = dirtyIds.includes(p.id)
                return (
                  <tr
                    key={p.id}
                    className={[
                      'border-b border-slate-100 last:border-0',
                      isDirty ? 'bg-amber-50' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.default_unit || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={value}
                        onChange={(e) => handleRateChange(p.id, e.target.value)}
                        className="w-32 border border-slate-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-light"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
