import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  const { user_id, charity_id } = await req.json()

  await supabase
    .from("users")
    .update({ charity_id })
    .eq("id", user_id)

  return Response.json({ success: true })
}
