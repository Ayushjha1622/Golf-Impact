import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/admin/users — list all users with subscription info
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await adminSupabase
      .from('users')
      .select('id, email, subscription_status, charity_percent, created_at, charities(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return NextResponse.json({ users: data, total: count, page })
  } catch (err) {
    console.error('[GET /api/admin/users]', err)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// PATCH /api/admin/users — update a user's subscription status
export async function PATCH(req) {
  try {
    const { userId, subscription_status } = await req.json()

    if (!userId || !subscription_status) {
      return NextResponse.json({ error: 'userId and subscription_status are required' }, { status: 400 })
    }

    const validStatuses = ['active', 'inactive', 'renewal_pending']
    if (!validStatuses.includes(subscription_status)) {
      return NextResponse.json({ error: `Status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const { data, error } = await adminSupabase
      .from('users')
      .update({ subscription_status })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ user: data })
  } catch (err) {
    console.error('[PATCH /api/admin/users]', err)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
