import { Trash2 } from 'lucide-react'
import RichTextEditor from './RichTextEditor'

/**
 * One line item row. Selecting a product auto-fills description/unit/rate
 * from Product Master (Phase 5) — all three remain fully editable afterward,
 * per the spec ("user should still be able to edit everything manually").
 */
export default function QuotationItemRow({ item, index, products, onChange, onRemove }) {
  function handleProductSelect(e) {
    const productId = e.target.value
    if (!productId) {
      onChange({ ...item, product_id: null })
      return
    }
    const product = products.find((p) => p.id === productId)
    onChange({
      ...item,
      product_id: productId,
      description: product.default_description
        ? `<p>${product.default_description}</p>`
        : item.description,
      unit: product.default_unit || item.unit,
      rate: product.default_rate ?? item.rate,
    })
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-brand-dark text-white text-xs font-medium shrink-0">
            {index + 1}
          </span>
          <select
            value={item.product_id || ''}
            onChange={handleProductSelect}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light max-w-xs"
          >
            <option value="">Custom (no product selected)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRemove}
          title="Remove item"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
      <RichTextEditor
        value={item.description}
        onChange={(html) => onChange({ ...item, description: html })}
      />

      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Rate (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={item.rate}
            onChange={(e) => onChange({ ...item, rate: e.target.value })}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
          <input
            type="text"
            value={item.unit}
            onChange={(e) => onChange({ ...item, unit: e.target.value })}
            placeholder="SQM"
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Quantity <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={item.quantity}
            onChange={(e) => onChange({ ...item, quantity: e.target.value })}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
        </div>
      </div>
    </div>
  )
}
