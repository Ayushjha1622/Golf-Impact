import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST() {
  try {
    const { data: entries } = await supabase
      .from('draw_entries')
      .select('*')

    let winnerFound = entries && entries.length > 0
    let winner = null

    if (!winnerFound) {
      // Feature 10: Jackpot Rollover Logic
      const { data: jackpotRow } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'jackpot_amount')
        .maybeSingle()
      
      let jackpot = jackpotRow ? parseFloat(jackpotRow.value) : 0
      jackpot += 1000
      
      await supabase.from('settings').upsert({
        key: 'jackpot_amount',
        value: jackpot
      })

      return Response.json({ error: 'No entries', jackpot_rolled_over: true, new_jackpot: jackpot })
    }

    winner = entries[Math.floor(Math.random() * entries.length)]

    await supabase.from('winners').insert({
      user_id: winner.user_id,
      tier: 'Jackpot',
      payment_status: 'pending'
    })

    return Response.json({ winner })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
