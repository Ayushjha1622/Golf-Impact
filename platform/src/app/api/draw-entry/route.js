import { NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/draw-entry — automatically create draw entries for eligible users
export async function POST(req) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's scores
    const { data: scores, error: scoresErr } = await adminSupabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)

    if (scoresErr) throw scoresErr

    const totalScores = scores?.length || 0
    const eligibleEntries = Math.floor(totalScores / 5)

    if (eligibleEntries === 0) {
      return NextResponse.json({
        eligible: false,
        message: `You need ${5 - totalScores} more scores to earn a draw entry.`,
        totalScores,
        drawEntries: 0,
      })
    }

    // Check how many draw entries the user already has
    const { data: existingEntries } = await adminSupabase
      .from('draw_entries')
      .select('id')
      .eq('user_id', user.id)

    const existingCount = existingEntries?.length || 0

    // Only insert new entries they haven't earned yet
    const newEntries = eligibleEntries - existingCount

    if (newEntries > 0) {
      const rows = Array.from({ length: newEntries }, () => ({
        user_id: user.id,
      }))

      const { error: insertErr } = await adminSupabase
        .from('draw_entries')
        .insert(rows)

      if (insertErr) throw insertErr
    }

    return NextResponse.json({
      eligible: true,
      totalScores,
      drawEntries: eligibleEntries,
      newEntriesAdded: Math.max(newEntries, 0),
    })
  } catch (err) {
    console.error('[POST /api/draw-entry]', err)
    return NextResponse.json({ error: err.message || 'Failed to process draw entry' }, { status: 500 })
  }
}
