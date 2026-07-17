import { useState, useEffect, useRef } from 'react'
import { Check, UserPlus } from 'lucide-react'
import { searchClients } from '../lib/clientsApi'

/**
 * Client name input with live autocomplete. Used on the New Quotation page.
 *
 * Behavior:
 * - Typing searches existing clients (debounced 250ms so we're not firing
 *   a query on every keystroke).
 * - Selecting a suggestion calls onSelectClient(client) with the FULL
 *   client record, so the parent form can auto-fill company/phone/etc.
 * - If nothing is selected and the typed name doesn't match an existing
 *   client, onSelectClient(null) is called — the parent treats this as
 *   "will create a new client with this name on save" (see NewQuotation.jsx
 *   in Phase 7 for where that create actually happens).
 */
export default function ClientAutocomplete({ value, onChange, onSelectClient }) {
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
        setSuggestions(await searchClients(value))
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(debounceRef.current)
  }, [value])

  // Close the dropdown when clicking outside it
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
    onSelectClient(null) // typing invalidates any previous selection
    setOpen(true)
  }

  function handleSelect(client) {
    onChange(client.name)
    onSelectClient(client)
    setOpen(false)
  }

  const exactMatch = suggestions.some(
    (c) => c.name.toLowerCase() === value?.trim().toLowerCase()
  )

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder="Start typing a client name…"
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
        autoComplete="off"
      />

      {open && value?.trim() && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-slate-400">Searching…</div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-slate-500 flex items-center gap-2">
              <UserPlus size={15} className="text-brand-mid shrink-0" />
              <span>
                No match — <span className="font-medium text-slate-700">"{value}"</span> will
                be created as a new client
              </span>
            </div>
          )}

          {!loading &&
            suggestions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
              >
                <span>
                  <span className="font-medium text-slate-800">{c.name}</span>
                  {c.company && (
                    <span className="text-slate-400"> — {c.company}</span>
                  )}
                </span>
                {c.name.toLowerCase() === value?.trim().toLowerCase() && (
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
