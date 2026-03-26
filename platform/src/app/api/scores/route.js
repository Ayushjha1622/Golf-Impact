import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { user_id, score, course_name } = await req.json()

    if (!score || !course_name) {
      return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    // insert score
    const { error } = await supabase
      .from("scores")
      .insert({
        user_id,
        score,
        course_name
      })

    if (error) throw error

    // count scores
    const { count } = await supabase
      .from("scores")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)

    // if eligible create draw entry
    if (count >= 5) {
      await supabase.from("draw_entries").insert({
        user_id
      })
    }

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
