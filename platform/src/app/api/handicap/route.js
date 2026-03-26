import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get("user_id")

  const { data } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", user_id)
    .order("played_at", { ascending: false })
    .limit(5)

  if (!data || data.length < 5) {
    return Response.json({ handicap: null })
  }

  const avg =
    data.reduce((sum, s) => sum + s.score, 0) / data.length

  return Response.json({
    handicap: avg.toFixed(1)
  })
}
