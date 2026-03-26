import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { userId, charityId, percent } = await req.json()

    await supabase
      .from('charity_choices')
      .upsert({
        user_id: userId,
        charity_id: charityId,
        percent
      }, { onConflict: 'user_id' })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
