import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const emptyForm = {
  name: '',
  company: '',
  address: '',
  phone: '',
  email: '',
  gst_number: '',
}

export default function ClientFormModal({ open, client, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '',
        company: client.company || '',
        address: client.address || '',
        phone: client.phone || '',
        email: client.email || '',
        gst_number: client.gst_number || '',
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [client, open])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Client name is required.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        company: form.company.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        gst_number: form.gst_number.trim() || null,
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
            {client ? 'Edit client' : 'Add client'}
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
          Client name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Santosh Singh Ji"
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Company
        </label>
        <input
          type="text"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder="e.g. Le Meridien, Ayodhya Road"
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Address
        </label>
        <textarea
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          rows={2}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light resize-none"
        />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-1">
          GST number
        </label>
        <input
          type="text"
          value={form.gst_number}
          onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
        />

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
            {saving ? 'Saving…' : 'Save client'}
          </button>
        </div>
      </form>
    </div>
  )
}
