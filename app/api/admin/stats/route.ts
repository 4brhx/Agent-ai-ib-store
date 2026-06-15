import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  try {
    // Total subscribers
    const { count: total } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })

    // Active subscribers
    const { count: active } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'subscribed')

    // By circle status
    const { count: activeCircle } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('circle_status', 'active')

    const { count: inactiveCircle } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('circle_status', 'inactive')

    // Categories count
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    // Recent subscribers (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recent } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Subscribers per category
    const { data: categories } = await supabase.from('categories').select('id, name, slug')

    const categoryStats = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .eq('status', 'subscribed')
        return { name: cat.name, slug: cat.slug, count: count || 0 }
      }),
    )

    return NextResponse.json({
      total: total || 0,
      active: active || 0,
      activeCircle: activeCircle || 0,
      inactiveCircle: inactiveCircle || 0,
      categories: categoriesCount || 0,
      recent: recent || 0,
      categoryStats,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ message: 'Failed to fetch stats' }, { status: 500 })
  }
}
