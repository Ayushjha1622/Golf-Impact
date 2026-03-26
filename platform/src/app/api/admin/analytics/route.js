import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { calculatePrizePool } from '@/utils/drawEngine'

const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/admin/analytics — platform-wide stats
export async function GET() {
  try {
    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: draws },
      { data: winners },
      { data: charities },
    ] = await Promise.all([
      adminSupabase.from('users').select('*', { count: 'exact', head: true }),
      adminSupabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      adminSupabase.from('draws').select('total_revenue, status'),
      adminSupabase.from('winners').select('prize_amount, payment_status, tier'),
      adminSupabase.from('charities').select('id', { count: 'exact', head: true }),
    ])

    const totalRevenue = draws?.reduce((sum, d) => sum + (Number(d.total_revenue) || 0), 0) || 0
    const publishedDraws = draws?.filter(d => d.status === 'published').length || 0
    const totalPaidOut = winners?.filter(w => w.payment_status === 'paid').reduce((s, w) => s + (Number(w.prize_amount) || 0), 0) || 0
    const pendingPayouts = winners?.filter(w => w.payment_status === 'pending').length || 0

    const prizeBreakdown = calculatePrizePool(totalRevenue)

    return NextResponse.json({
      totalUsers,
      activeSubscribers,
      totalRevenue: totalRevenue.toFixed(2),
      publishedDraws,
      totalPaidOut: totalPaidOut.toFixed(2),
      pendingPayouts,
      prizeBreakdown,
      tierStats: {
        tier5: winners?.filter(w => w.tier === 'tier5').length || 0,
        tier4: winners?.filter(w => w.tier === 'tier4').length || 0,
        tier3: winners?.filter(w => w.tier === 'tier3').length || 0,
      }
    })
  } catch (err) {
    console.error('[GET /api/admin/analytics]', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
