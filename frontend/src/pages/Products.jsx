import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../lib/productsApi'
import ProductFormModal from '../components/ProductFormModal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null) // null = "add new"
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      setProducts(await listProducts())
    } catch (err) {
      setError(err.message || 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingProduct(null)
    setModalOpen(true)
  }

  function openEditModal(product) {
    setEditingProduct(product)
    setModalOpen(true)
  }

  async function handleSave(formValues) {
    if (editingProduct) {
      const updated = await updateProduct(editingProduct.id, formValues)
      setProducts((prev) =>
        prev
          .map((p) => (p.id === updated.id ? updated : p))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    } else {
      const created = await createProduct(formValues)
      setProducts((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      )
    }
    setModalOpen(false)
  }

  async function handleDelete() {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteProduct(target.id)
      setProducts((prev) => prev.filter((p) => p.id !== target.id))
    } catch (err) {
      setError(err.message || 'Failed to delete product.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">Products</h1>
          <p className="text-sm text-slate-500">
            Product Master — default description, unit, and rate auto-fill into new quotation line items.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-brand-dark hover:bg-brand-mid text-white text-sm font-medium rounded-md px-4 py-2 transition-colors shrink-0"
        >
          <Plus size={16} />
          Add product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">No products yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Add your first product to start building your master list.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Default Description</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium text-right">Rate (₹)</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                    {p.default_description || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.default_unit || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {p.default_rate != null ? p.default_rate.toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit"
                        className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
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

      <ProductFormModal
        open={modalOpen}
        product={editingProduct}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed from your Product Master. This won't affect quotations that already used it.`
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
