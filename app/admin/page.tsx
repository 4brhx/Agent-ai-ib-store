'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, Tag, TrendingUp, Activity, Loader2 } from 'lucide-react'

interface Stats {
  total: number
  active: number
  activeCircle: number
  inactiveCircle: number
  categories: number
  recent: number
  categoryStats: { name: string; slug: string; count: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  const cards = [
    {
      title: 'إجمالي المشتركين',
      value: stats?.total ?? 0,
      icon: Users,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'مشتركين نشطين',
      value: stats?.active ?? 0,
      icon: UserCheck,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'جديد (7 أيام)',
      value: stats?.recent ?? 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bg: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'التصنيفات',
      value: stats?.categories ?? 0,
      icon: Tag,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على المشتركين والتصنيفات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className={`${card.bg} p-3 rounded-lg`}>
                <card.icon className={`size-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Circle Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="size-5 text-blue-600" />
            حالة المشتركين
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">نشط</span>
              </div>
              <span className="font-semibold text-gray-800">{stats?.activeCircle ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">غير نشط</span>
              </div>
              <span className="font-semibold text-gray-800">{stats?.inactiveCircle ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-gray-300" />
                <span className="text-sm text-gray-600">غير مصنف</span>
              </div>
              <span className="font-semibold text-gray-800">
                {(stats?.total ?? 0) - (stats?.activeCircle ?? 0) - (stats?.inactiveCircle ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Tag className="size-5 text-blue-600" />
            المشتركين حسب التصنيف
          </h3>
          <div className="space-y-3">
            {stats?.categoryStats && stats.categoryStats.length > 0 ? (
              stats.categoryStats.map((cat) => (
                <div key={cat.slug} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600">
                      {cat.name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-600">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{cat.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">لا توجد تصنيفات بعد</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
