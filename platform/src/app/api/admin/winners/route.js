import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/admin/winners — list winners with filters
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // pending | approved | paid

    let query = adminSupabase
      .from('winners')
      .select('*, users(email), draws(draw_date, winning_numbers)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('payment_status', status)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ winners: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 })
  }
}

// PATCH /api/admin/winners — update payment status
export async function PATCH(req) {
  try {
    const { id, payment_status } = await req.json()

    if (!id || !payment_status) {
      return NextResponse.json({ error: 'id and payment_status are required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'approved', 'paid', 'rejected']
    if (!validStatuses.includes(payment_status)) {
      return NextResponse.json({ error: `Status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const { data, error } = await adminSupabase
      .from('winners')
      .update({ payment_status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ winner: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update winner' }, { status: 500 })
  }
}
