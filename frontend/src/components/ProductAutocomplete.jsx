import { useState, useEffect, useRef } from 'react'
import { Check, PackagePlus } from 'lucide-react'
import { searchProducts } from '../lib/productsApi'

/**
 * Product name input with live autocomplete — same pattern as
 * ClientAutocomplete. Typing a name that doesn't exist yet is fine; the
 * Rate Calculator creates it as a new Product Master entry on save. This
 * is what lets you type ANY glass name here, not just ones that already
 * exist in Product Master.
 */
export default function ProductAutocomplete({ value, onChange, onSelectProduct }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)

    if (!value || !value.trim()) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        setSuggestions(await searchProducts(value))
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(debounceRef.current)
  }, [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e) {
    onChange(e.target.value)
    onSelectProduct(null)
    setOpen(true)
  }

  function handleSelect(product) {
    onChange(product.name)
    onSelectProduct(product)
    setOpen(false)
  }

  const exactMatch = suggestions.some(
    (p) => p.name.toLowerCase() === value?.trim().toLowerCase()
  )

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value || ''}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder="Type any product name — existing or new…"
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
        autoComplete="off"
      />

      {open && value?.trim() && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {loading && <div className="px-3 py-2 text-sm text-slate-400">Searching…</div>}

          {!loading && suggestions.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-slate-500 flex items-center gap-2">
              <PackagePlus size={15} className="text-brand-mid shrink-0" />
              <span>
                No match — <span className="font-medium text-slate-700">"{value}"</span> will
                be created as a new product in Product Master
              </span>
            </div>
          )}

          {!loading &&
            suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
              >
                <span>
                  <span className="font-medium text-slate-800">{p.name}</span>
                  {p.default_rate != null && (
                    <span className="text-slate-400"> — current rate ₹{p.default_rate}</span>
                  )}
                </span>
                {p.name.toLowerCase() === value?.trim().toLowerCase() && (
                  <Check size={14} className="text-green-600 shrink-0" />
                )}
              </button>
            ))}

          {!loading && suggestions.length > 0 && !exactMatch && (
            <div className="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">
              No exact match — "{value}" will be created as new if you don't pick one above
            </div>
          )}
        </div>
      )}
    </div>
  )
}
