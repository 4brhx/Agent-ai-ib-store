import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Admin categories error:', error.message)
      return NextResponse.json({ message: 'Failed to fetch categories' }, { status: 500 })
    }

    // Get subscriber count per category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
        return { ...cat, subscriber_count: count || 0 }
      }),
    )

    return NextResponse.json({ categories: categoriesWithCounts })
  } catch (error) {
    console.error('Admin categories error:', error)
    return NextResponse.json({ message: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  try {
    const body: { name: string; slug?: string; description?: string; sort_order?: number } =
      await request.json()

    if (!body.name) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 })
    }

    const slug = body.slug || body.name.toLowerCase().replaceAll(/\s+/g, '-')

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: body.name,
        slug,
        description: body.description || '',
        sort_order: body.sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Admin create category error:', error.message)
      return NextResponse.json({ message: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category: data }, { status: 201 })
  } catch (error) {
    console.error('Admin create category error:', error)
    return NextResponse.json({ message: 'Failed to create category' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  try {
    const body: { id: string; name?: string; description?: string; sort_order?: number } =
      await request.json()

    if (!body.id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Admin update category error:', error.message)
      return NextResponse.json({ message: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ category: data })
  } catch (error) {
    console.error('Admin update category error:', error)
    return NextResponse.json({ message: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  try {
    const body: { id: string } = await request.json()

    const { error } = await supabase.from('categories').delete().eq('id', body.id)

    if (error) {
      console.error('Admin delete category error:', error.message)
      return NextResponse.json({ message: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Category deleted' })
  } catch (error) {
    console.error('Admin delete category error:', error)
    return NextResponse.json({ message: 'Failed to delete category' }, { status: 500 })
  }
}
