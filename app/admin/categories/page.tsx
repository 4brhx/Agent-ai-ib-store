'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, Edit2, Trash2, Save } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  sort_order: number
  subscriber_count: number
  created_at: string
}

const categoryColors: Record<string, string> = {
  steam: 'bg-blue-100 text-blue-700 border-blue-200',
  xbox: 'bg-green-100 text-green-700 border-green-200',
  pc: 'bg-purple-100 text-purple-700 border-purple-200',
  vinny: 'bg-amber-100 text-amber-700 border-amber-200',
}

const categoryIcons: Record<string, string> = {
  steam: '🎮',
  xbox: '🎯',
  pc: '💻',
  vinny: '🎪',
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSortOrder, setFormSortOrder] = useState(0)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/categories')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          sort_order: formSortOrder,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        resetForm()
        fetchCategories()
      } else {
        const data = await res.json()
        alert(data.message || 'فشل الإضافة')
      }
    } catch {
      alert('فشل الإضافة')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCat) return
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editCat.id,
          name: formName,
          description: formDescription,
          sort_order: formSortOrder,
        }),
      })
      if (res.ok) {
        setEditCat(null)
        resetForm()
        fetchCategories()
      } else {
        const data = await res.json()
        alert(data.message || 'فشل التحديث')
      }
    } catch {
      alert('فشل التحديث')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف التصنيف "${name}"؟`)) return
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        fetchCategories()
      }
    } catch {
      alert('فشل الحذف')
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormSortOrder(0)
  }

  const openEdit = (cat: Category) => {
    setEditCat(cat)
    setFormName(cat.name)
    setFormDescription(cat.description || '')
    setFormSortOrder(cat.sort_order || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة التصنيفات</h1>
          <p className="text-gray-500 mt-1">إضافة وتعديل التصنيفات الأساسية</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="size-4" />
          إضافة تصنيف
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 text-blue-600 animate-spin" />
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Default Categories Display */}
          {categories.map((cat) => {
            const colorClass =
              categoryColors[cat.slug] || 'bg-gray-100 text-gray-700 border-gray-200'
            return (
              <div
                key={cat.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`size-12 rounded-xl ${colorClass.split(' ')[0]} flex items-center justify-center text-xl`}
                  >
                    {categoryIcons[cat.slug] || '📁'}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-800 mb-1">{cat.name}</h3>
                {cat.description && <p className="text-sm text-gray-500 mb-3">{cat.description}</p>}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
                  >
                    {cat.slug}
                  </span>
                  <span className="text-sm text-gray-500">
                    <strong className="text-gray-800">{cat.subscriber_count}</strong> مشترك
                  </span>
                </div>
              </div>
            )
          })}

          {/* Add Card */}
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center min-h-[180px]"
          >
            <Plus className="size-8 text-gray-300 mb-2" />
            <span className="text-sm text-gray-500 font-medium">إضافة تصنيف جديد</span>
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editCat) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {editCat ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditCat(null)
                  resetForm()
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="size-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={editCat ? handleEdit : handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم التصنيف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="وصف التصنيف"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ترتيب العرض</label>
                <input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Save className="size-4" />
                  {editCat ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditCat(null)
                    resetForm()
                  }}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
