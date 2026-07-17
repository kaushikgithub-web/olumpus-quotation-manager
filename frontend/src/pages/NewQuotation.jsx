import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, FileDown, Printer, Copy, Save } from 'lucide-react'
import { listProducts } from '../lib/productsApi'
import {
  getQuotation,
  getNextReferenceNumber,
  createQuotation,
  updateQuotation,
  duplicateQuotation,
  downloadQuotationPdf,
  printQuotationPdf,
} from '../lib/quotationsApi'
import ClientAutocomplete from '../components/ClientAutocomplete'
import QuotationItemRow from '../components/QuotationItemRow'

const STATUS_OPTIONS = ['draft', 'sent', 'accepted', 'rejected', 'expired']

const emptyItem = () => ({
  product_id: null,
  description: '',
  rate: '',
  unit: '',
  quantity: '',
})

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function NewQuotation() {
  const { id } = useParams() // present only in edit mode
  const isEditMode = Boolean(id)
  const navigate = useNavigate()

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [printing, setPrinting] = useState(false)

  const [referenceNumber, setReferenceNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [companyName, setCompanyName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [quotationDate, setQuotationDate] = useState(todayISO())
  const [validityDays, setValidityDays] = useState(7)
  const [gstApplicable, setGstApplicable] = useState(true)
  const [remarks, setRemarks] = useState('')
  const [status, setStatus] = useState('draft')
  const [items, setItems] = useState([emptyItem()])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoadingInitial(true)
      setError('')
      try {
        const productList = await listProducts()
        if (cancelled) return
        setProducts(productList)

        if (isEditMode) {
          const { quotation, items: loadedItems } = await getQuotation(id)
          if (cancelled) return
          setReferenceNumber(quotation.reference_number)
          setClientName(quotation.clients?.name || '')
          setSelectedClient(quotation.clients || null)
          setCompanyName(quotation.clients?.company || '')
          setProjectName(quotation.project_name || '')
          setQuotationDate(quotation.quotation_date || todayISO())
          setValidityDays(quotation.validity_days ?? 7)
          setGstApplicable(quotation.gst_applicable ?? true)
          setRemarks(quotation.remarks || '')
          setStatus(quotation.status || 'draft')
          setItems(
            loadedItems.length > 0
              ? loadedItems.map((it) => ({
                  product_id: it.product_id,
                  description: it.description || '',
                  rate: it.rate ?? '',
                  unit: it.unit || '',
                  quantity: it.quantity ?? '',
                }))
              : [emptyItem()]
          )
        } else {
          const ref = await getNextReferenceNumber()
          if (cancelled) return
          setReferenceNumber(ref)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load.')
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [id, isEditMode])

  function updateItem(index, updated) {
    setItems((prev) => prev.map((it, i) => (i === index ? updated : it)))
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  async function handleSave() {
    setError('')

    if (!clientName.trim()) {
      setError('Client name is required.')
      return
    }
    if (items.length === 0) {
      setError('Add at least one line item.')
      return
    }
    for (const item of items) {
      if (!item.description || item.description === '<p></p>') {
        setError('Every line item needs a description.')
        return
      }
      if (item.rate === '' || item.rate === null) {
        setError('Every line item needs a rate.')
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        quotation: {
          reference_number: referenceNumber,
          project_name: projectName.trim() || null,
          quotation_date: quotationDate,
          validity_days: Number(validityDays) || null,
          gst_applicable: gstApplicable,
          remarks: remarks.trim() || null,
          status,
        },
        items: items.map((it) => ({
          product_id: it.product_id,
          description: it.description,
          rate: Number(it.rate),
          unit: it.unit,
          quantity: it.quantity === '' ? null : Number(it.quantity),
        })),
        client: selectedClient,
        clientName,
        companyName,
      }

      if (isEditMode) {
        await updateQuotation(id, payload)
      } else {
        await createQuotation(payload)
      }

      navigate('/quotation-history', { state: { saved: true, reference: referenceNumber } })
    } catch (err) {
      setError(err.message || 'Failed to save quotation.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicate() {
    setDuplicating(true)
    setError('')
    try {
      const newId = await duplicateQuotation(id)
      navigate(`/new-quotation/${newId}`)
    } catch (err) {
      setError(err.message || 'Failed to duplicate quotation.')
    } finally {
      setDuplicating(false)
    }
  }

  async function handleGeneratePdf() {
    setDownloadingPdf(true)
    setError('')
    try {
      await downloadQuotationPdf(id, referenceNumber)
    } catch (err) {
      setError(err.message || 'Failed to generate PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handlePrint() {
    setPrinting(true)
    setError('')
    try {
      await printQuotationPdf(id, referenceNumber)
    } catch (err) {
      setError(err.message || 'Failed to open print dialog.')
    } finally {
      setPrinting(false)
    }
  }

  if (loadingInitial) {
    return <div className="text-sm text-slate-400">Loading…</div>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">
            {isEditMode ? 'Edit Quotation' : 'New Quotation'}
          </h1>
          <p className="text-sm text-slate-500">
            Ref. No. <span className="font-medium text-slate-700">{referenceNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEditMode && (
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              title="Duplicate this quotation with a new reference number"
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-dark border border-slate-200 hover:border-brand-light rounded-md px-3 py-2 transition-colors disabled:opacity-50"
            >
              <Copy size={15} />
              {duplicating ? 'Duplicating…' : 'Duplicate'}
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={!isEditMode || printing}
            title={isEditMode ? 'Print the last saved version' : 'Save the quotation first'}
            className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-slate-200 text-slate-600 hover:text-brand-dark hover:border-brand-light"
          >
            <Printer size={15} />
            {printing ? 'Opening…' : 'Print'}
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={!isEditMode || downloadingPdf}
            title={isEditMode ? 'Downloads a PDF of the last saved version' : 'Save the quotation first'}
            className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-slate-200 text-slate-600 hover:text-brand-dark hover:border-brand-light"
          >
            <FileDown size={15} />
            {downloadingPdf ? 'Generating…' : 'Generate PDF'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-brand-dark hover:bg-brand-mid text-white text-sm font-medium rounded-md px-4 py-2 transition-colors disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      {/* --- Client & project details --- */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Client name
            </label>
            <ClientAutocomplete
              value={clientName}
              onChange={setClientName}
              onSelectClient={(client) => {
                setSelectedClient(client)
                if (client) setCompanyName(client.company || '')
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Le Meridien, Ayodhya Road, Lucknow"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Validity (days)
            </label>
            <input
              type="number"
              min="1"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light capitalize"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={gstApplicable}
                onChange={(e) => setGstApplicable(e.target.checked)}
                className="rounded border-slate-300"
              />
              GST extra
            </label>
          </div>
        </div>
      </div>

      {/* --- Line items --- */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Line items</h2>
        <button
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-brand-dark hover:text-brand-mid font-medium"
        >
          <Plus size={15} />
          Add item
        </button>
      </div>

      <div className="space-y-3 mb-5">
        {items.map((item, index) => (
          <QuotationItemRow
            key={index}
            item={item}
            index={index}
            products={products}
            onChange={(updated) => updateItem(index, updated)}
            onRemove={() => removeItem(index)}
          />
        ))}
      </div>

      {/* --- Remarks --- */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Remarks <span className="text-slate-400 font-normal">(internal, optional)</span>
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light resize-none"
        />
      </div>
    </div>
  )
}
