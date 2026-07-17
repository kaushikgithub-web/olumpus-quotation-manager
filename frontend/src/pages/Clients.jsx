import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react'
import { listClients, createClient, updateClient, deleteClient } from '../lib/clientsApi'
import ClientFormModal from '../components/ClientFormModal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      setClients(await listClients())
    } catch (err) {
      setError(err.message || 'Failed to load clients.')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingClient(null)
    setModalOpen(true)
  }

  function openEditModal(client) {
    setEditingClient(client)
    setModalOpen(true)
  }

  async function handleSave(formValues) {
    if (editingClient) {
      const updated = await updateClient(editingClient.id, formValues)
      setClients((prev) =>
        prev
          .map((c) => (c.id === updated.id ? updated : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    } else {
      const created = await createClient(formValues)
      setClients((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      )
    }
    setModalOpen(false)
  }

  async function handleDelete() {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteClient(target.id)
      setClients((prev) => prev.filter((c) => c.id !== target.id))
    } catch (err) {
      setError(
        err.message?.includes('violates foreign key')
          ? `Can't delete "${target.name}" — they have existing quotations on file.`
          : err.message || 'Failed to delete client.'
      )
    }
  }

  const filtered = clients.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">Clients</h1>
          <p className="text-sm text-slate-500">
            New clients are also created automatically the first time you quote them.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-brand-dark hover:bg-brand-mid text-white text-sm font-medium rounded-md px-4 py-2 transition-colors shrink-0"
        >
          <Plus size={16} />
          Add client
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, email, phone…"
          className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading clients…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">
              {clients.length === 0 ? 'No clients yet' : 'No matches'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {clients.length === 0
                ? 'Add your first client, or one will be created automatically from your next quotation.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">GST No.</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.gst_number || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEditModal(c)}
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
        )}
      </div>

      <ClientFormModal
        open={modalOpen}
        client={editingClient}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete client?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed. This will fail if they have existing quotations on file.`
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
