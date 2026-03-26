import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { userId } = await req.json()

    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)

    if (data.length < 5)
      return Response.json({ eligible: false })

    await supabase.from('draw_entries').insert({
      user_id: userId
    })

    return Response.json({ eligible: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
