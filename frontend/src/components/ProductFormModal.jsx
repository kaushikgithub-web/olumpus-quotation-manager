import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const COMMON_UNITS = ['SQM', 'SFT', 'RFT', 'NOS', 'MTR', 'KG']

const emptyForm = {
  name: '',
  default_description: '',
  default_unit: '',
  default_rate: '',
}

export default function ProductFormModal({ open, product, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset the form whenever a different product is opened (or "Add new")
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        default_description: product.default_description || '',
        default_unit: product.default_unit || '',
        default_rate: product.default_rate ?? '',
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [product, open])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Product name is required.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        default_description: form.default_description.trim() || null,
        default_unit: form.default_unit.trim() || null,
        default_rate: form.default_rate === '' ? null : Number(form.default_rate),
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">
            {product ? 'Edit product' : 'Add product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Product name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. 12MM Saint Gobain Low-E"
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Default description
        </label>
        <textarea
          value={form.default_description}
          onChange={(e) => setForm({ ...form, default_description: e.target.value })}
          placeholder="Auto-fills into the quotation line item — still editable there."
          rows={3}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light resize-none"
        />

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default unit
            </label>
            <input
              type="text"
              list="unit-suggestions"
              value={form.default_unit}
              onChange={(e) => setForm({ ...form, default_unit: e.target.value })}
              placeholder="SQM"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
            <datalist id="unit-suggestions">
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default rate (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.default_rate}
              onChange={(e) => setForm({ ...form, default_rate: e.target.value })}
              placeholder="0.00"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md bg-brand-dark hover:bg-brand-mid text-white transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </form>
    </div>
  )
}
