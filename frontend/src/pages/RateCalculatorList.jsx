import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Calculator, Eye } from 'lucide-react'
import { listRateCalculations, deleteRateCalculation, calculateRate } from '../lib/rateCalculationsApi'
import ConfirmDialog from '../components/ConfirmDialog'

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

export default function RateCalculatorList() {
  const navigate = useNavigate()
  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      setCalculations(await listRateCalculations())
    } catch (err) {
      setError(err.message || 'Failed to load calculations.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteRateCalculation(target.id)
      setCalculations((prev) => prev.filter((c) => c.id !== target.id))
    } catch (err) {
      setError(err.message || 'Failed to delete calculation.')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">Rate Calculator</h1>
          <p className="text-sm text-slate-500">
            Cost buildup worksheet — Landed Total → Total 1 → Total 2 → Rate Given.
          </p>
        </div>
        <button
          onClick={() => navigate('/rate-calculator/new')}
          className="flex items-center justify-center gap-1.5 bg-brand-dark hover:bg-brand-mid text-white text-sm font-medium rounded-md px-4 py-2 transition-colors shrink-0"
        >
          <Plus size={16} />
          New Calculation
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : calculations.length === 0 ? (
          <div className="p-10 text-center">
            <Calculator className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">No calculations yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Start a new one to work out a rate for a glass combination.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Glass Name</th>
                  <th className="px-4 py-3 font-medium">Linked Product</th>
                  <th className="px-4 py-3 font-medium text-right">Assessable Value (₹)</th>
                  <th className="px-4 py-3 font-medium text-right">Total 2 (₹)</th>
                  <th className="px-4 py-3 font-medium text-right">Rate Given (₹)</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.glass_name}</td>
                    <td className="px-4 py-3 text-slate-500">{c.products?.name || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {fmt(calculateRate(c).assessableValue)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {c.total2_snapshot != null ? Number(c.total2_snapshot).toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {c.rate_given != null ? Number(c.rate_given).toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/rate-calculator/${c.id}/view`)}
                          title="View"
                          className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/rate-calculator/${c.id}`)}
                          title="Edit"
                          className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete calculation?"
        message={
          deleteTarget
            ? `"${deleteTarget.glass_name}" will be permanently deleted. This won't affect any product rate you already pushed from it.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
