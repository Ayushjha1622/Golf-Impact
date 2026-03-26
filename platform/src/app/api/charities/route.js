import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// GET /api/charities — list all charities
export async function GET() {
  try {
    const adminSupabase = getAdminSupabase()
    const { data, error } = await adminSupabase
      .from('charities')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name')

    if (error) throw error
    return NextResponse.json({ charities: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch charities' }, { status: 500 })
  }
}

// POST /api/charities — create a new charity (admin)
export async function POST(req) {
  try {
    const adminSupabase = getAdminSupabase()
    const body = await req.json()
    const { name, description, website_url, is_featured } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Charity name is required' }, { status: 400 })
    }

    const { data, error } = await adminSupabase
      .from('charities')
      .insert({ name: name.trim(), description, website_url, is_featured: !!is_featured })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ charity: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/charities]', err)
    return NextResponse.json({ error: 'Failed to create charity' }, { status: 500 })
  }
}

// PATCH /api/charities — update a charity
export async function PATCH(req) {
  try {
    const adminSupabase = getAdminSupabase()
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'Charity ID required' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('charities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ charity: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update charity' }, { status: 500 })
  }
}

// DELETE /api/charities?id=xxx
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Charity ID required' }, { status: 400 })

    const { error } = await adminSupabase.from('charities').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete charity' }, { status: 500 })
  }
}
