import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Copy, Pencil, FileText, FileDown, Printer, Trash2, X } from 'lucide-react'
import {
  listQuotations,
  duplicateQuotation,
  downloadQuotationPdf,
  printQuotationPdf,
  deleteQuotation,
} from '../lib/quotationsApi'
import ConfirmDialog from '../components/ConfirmDialog'

const STATUS_OPTIONS = ['draft', 'sent', 'accepted', 'rejected', 'expired']

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  expired: 'bg-amber-50 text-amber-700',
}

export default function QuotationHistory() {
  const navigate = useNavigate()
  const location = useLocation()

  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [duplicatingId, setDuplicatingId] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [printingId, setPrintingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [savedBanner, setSavedBanner] = useState(location.state?.saved ? location.state : null)

  const [filters, setFilters] = useState({
    clientName: '',
    referenceNumber: '',
    projectName: '',
    date: '',
    status: '',
  })

  useEffect(() => {
    refresh()
    // Clear the "saved" banner from location state so it doesn't reappear
    // on a later back-navigation to this page.
    if (savedBanner) {
      window.history.replaceState({}, document.title)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refresh(activeFilters = filters) {
    setLoading(true)
    setError('')
    try {
      setQuotations(await listQuotations(activeFilters))
    } catch (err) {
      setError(err.message || 'Failed to load quotations.')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(key, value) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    refresh(next)
  }

  function clearFilters() {
    const cleared = { clientName: '', referenceNumber: '', projectName: '', date: '', status: '' }
    setFilters(cleared)
    refresh(cleared)
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  async function handleDuplicate(id) {
    setDuplicatingId(id)
    setError('')
    try {
      const newId = await duplicateQuotation(id)
      navigate(`/new-quotation/${newId}`)
    } catch (err) {
      setError(err.message || 'Failed to duplicate quotation.')
      setDuplicatingId(null)
    }
  }

  async function handleDownloadPdf(q) {
    setDownloadingId(q.id)
    setError('')
    try {
      await downloadQuotationPdf(q.id, q.reference_number)
    } catch (err) {
      setError(err.message || 'Failed to generate PDF.')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handlePrint(q) {
    setPrintingId(q.id)
    setError('')
    try {
      await printQuotationPdf(q.id, q.reference_number)
    } catch (err) {
      setError(err.message || 'Failed to open print dialog.')
    } finally {
      setPrintingId(null)
    }
  }

  async function handleDelete() {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteQuotation(target.id)
      setQuotations((prev) => prev.filter((q) => q.id !== target.id))
    } catch (err) {
      setError(err.message || 'Failed to delete quotation.')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-dark mb-1">Quotation History</h1>
        <p className="text-sm text-slate-500">Search, edit, or duplicate past quotations.</p>
      </div>

      {savedBanner && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded mb-4 flex items-center justify-between">
          <span>Quotation {savedBanner.reference} saved successfully.</span>
          <button onClick={() => setSavedBanner(null)} className="text-green-700/60 hover:text-green-700">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      {/* --- Filters --- */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-5">
        <div className="grid grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={filters.clientName}
              onChange={(e) => handleFilterChange('clientName', e.target.value)}
              placeholder="Client"
              className="w-full border border-slate-300 rounded pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
          <input
            type="text"
            value={filters.referenceNumber}
            onChange={(e) => handleFilterChange('referenceNumber', e.target.value)}
            placeholder="Reference No."
            className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
          <input
            type="text"
            value={filters.projectName}
            onChange={(e) => handleFilterChange('projectName', e.target.value)}
            placeholder="Project"
            className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light capitalize"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-slate-600 mt-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* --- Results --- */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading quotations…</div>
        ) : quotations.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">
              {hasActiveFilters ? 'No matches' : 'No quotations yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {hasActiveFilters
                ? 'Try different search terms.'
                : 'Create your first quotation to see it here.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Reference No.</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Created by</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{q.reference_number}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {q.clients?.name || '—'}
                    {q.clients?.company && (
                      <span className="text-slate-400"> — {q.clients.company}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{q.project_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{q.quotation_date}</td>
                  <td className="px-4 py-3 text-slate-500">{q.created_by_email || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                        STATUS_STYLES[q.status] || 'bg-slate-100 text-slate-600',
                      ].join(' ')}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => navigate(`/new-quotation/${q.id}`)}
                        title="Edit"
                        className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(q)}
                        disabled={downloadingId === q.id}
                        title="Download PDF"
                        className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded disabled:opacity-50"
                      >
                        <FileDown size={15} />
                      </button>
                      <button
                        onClick={() => handlePrint(q)}
                        disabled={printingId === q.id}
                        title="Print"
                        className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded disabled:opacity-50"
                      >
                        <Printer size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        title="Delete"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(q.id)}
                        disabled={duplicatingId === q.id}
                        title="Duplicate"
                        className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded disabled:opacity-50"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete quotation?"
        message={
          deleteTarget
            ? `Quotation ${deleteTarget.reference_number} will be permanently deleted, along with all its line items. This can't be undone.`
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
