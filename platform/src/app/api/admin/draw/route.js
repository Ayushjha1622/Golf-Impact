import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST() {

  const { data } = await supabase
    .from("draw_entries")
    .select("*")

  if (!data || data.length === 0) {
    return Response.json({ error: "No entries" })
  }

  const winner =
    data[Math.floor(Math.random() * data.length)]

  await supabase
    .from("winners")
    .insert({
      user_id: winner.user_id,
      tier: "monthly"
    })

  return Response.json({ winner })
}
