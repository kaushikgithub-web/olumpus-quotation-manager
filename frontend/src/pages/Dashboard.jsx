import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  expired: 'bg-amber-50 text-amber-700',
}

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function startOfNextMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const firstName = session?.user?.email?.split('@')[0]

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    quotationsThisMonth: null,
    activeClients: null,
    productsInMaster: null,
  })
  const [recentQuotations, setRecentQuotations] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [quotationsCount, clientsCount, productsCount, recent] = await Promise.all([
          supabase
            .from('quotations')
            .select('*', { count: 'exact', head: true })
            .gte('quotation_date', startOfMonthISO())
            .lt('quotation_date', startOfNextMonthISO()),
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase
            .from('quotations')
            .select('id, reference_number, project_name, status, quotation_date, clients(name)')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (quotationsCount.error) throw quotationsCount.error
        if (clientsCount.error) throw clientsCount.error
        if (productsCount.error) throw productsCount.error
        if (recent.error) throw recent.error

        if (cancelled) return

        setStats({
          quotationsThisMonth: quotationsCount.count ?? 0,
          activeClients: clientsCount.count ?? 0,
          productsInMaster: productsCount.count ?? 0,
        })
        setRecentQuotations(recent.data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const statCards = [
    { label: 'Quotations this month', value: stats.quotationsThisMonth },
    { label: 'Active clients', value: stats.activeClients },
    { label: 'Products in master', value: stats.productsInMaster },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-slate-500">
            Olumpus Quotation Manager — here's your workspace.
          </p>
        </div>
        <button
          onClick={() => navigate('/new-quotation')}
          className="flex items-center justify-center gap-1.5 bg-brand-dark hover:bg-brand-mid text-white text-sm font-medium rounded-md px-4 py-2 transition-colors shrink-0"
        >
          <Plus size={16} />
          New Quotation
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-2xl font-bold text-brand-dark">
              {loading ? '…' : value}
            </p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent quotations</h2>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : recentQuotations.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">No quotations yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Create your first one to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Reference No.</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => navigate(`/new-quotation/${q.id}`)}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{q.reference_number}</td>
                    <td className="px-4 py-3 text-slate-600">{q.clients?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{q.project_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{q.quotation_date}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
