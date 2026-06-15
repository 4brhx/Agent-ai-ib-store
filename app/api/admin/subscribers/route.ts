import { NextResponse } from 'next/server'
import { getSupabaseClient, isValidEmail, normalizeEmail } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const status = url.searchParams.get('status')
  const circleStatus = url.searchParams.get('circle_status')
  const categoryId = url.searchParams.get('category_id')
  const search = url.searchParams.get('search')

  const from = (page - 1) * limit
  const to = from + limit - 1

  try {
    let query = supabase
      .from('subscribers')
      .select('*, category:category_id(id, name, slug)', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    if (circleStatus) {
      query = query.eq('circle_status', circleStatus)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }

    const {
      data: subscribers,
      count,
      error,
    } = await query.order('created_at', { ascending: false }).range(from, to)

    if (error) {
      console.error('Admin subscribers error:', error.message)
      return NextResponse.json({ message: 'Failed to fetch subscribers' }, { status: 500 })
    }

    return NextResponse.json({
      subscribers: subscribers || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Admin subscribers error:', error)
    return NextResponse.json({ message: 'Failed to fetch subscribers' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  try {
    const body: {
      id: string
      name?: string
      avatar_url?: string
      circle_status?: string
      category_id?: string | null
      status?: string
    } = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ message: 'Subscriber ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url
    if (updates.circle_status !== undefined) updateData.circle_status = updates.circle_status
    if (updates.category_id !== undefined) updateData.category_id = updates.category_id || null
    if (updates.status !== undefined) updateData.status = updates.status
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('subscribers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Admin update subscriber error:', error.message)
      return NextResponse.json({ message: 'Failed to update subscriber' }, { status: 500 })
    }

    return NextResponse.json({ subscriber: data })
  } catch (error) {
    console.error('Admin update subscriber error:', error)
    return NextResponse.json({ message: 'Failed to update subscriber' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  try {
    const body: { id: string } = await request.json()

    const { error } = await supabase.from('subscribers').delete().eq('id', body.id)

    if (error) {
      console.error('Admin delete subscriber error:', error.message)
      return NextResponse.json({ message: 'Failed to delete subscriber' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Subscriber deleted' })
  } catch (error) {
    console.error('Admin delete subscriber error:', error)
    return NextResponse.json({ message: 'Failed to delete subscriber' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({ message: 'Database not configured' }, { status: 503 })
  }

  try {
    const body: { email: string; name?: string; avatar_url?: string; category_id?: string } =
      await request.json()

    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json({ message: 'Valid email is required' }, { status: 400 })
    }

    const normalized = normalizeEmail(body.email)

    // Check if already exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', normalized)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email: normalized,
        name: body.name || '',
        avatar_url: body.avatar_url || '',
        category_id: body.category_id || null,
        status: 'subscribed',
        circle_status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Admin create subscriber error:', error.message)
      return NextResponse.json({ message: 'Failed to create subscriber' }, { status: 500 })
    }

    return NextResponse.json({ subscriber: data }, { status: 201 })
  } catch (error) {
    console.error('Admin create subscriber error:', error)
    return NextResponse.json({ message: 'Failed to create subscriber' }, { status: 500 })
  }
}
