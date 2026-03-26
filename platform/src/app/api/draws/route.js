import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { weightedDraw, generateRandomDraw, calculatePrizePool } from '@/utils/drawEngine'

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}


// GET /api/draws
export async function GET() {
  try {
    const adminSupabase = getAdminSupabase()
    const { data, error } = await adminSupabase
      .from('draws')
      .select('*')
      .order('draw_date', { ascending: false })
    if (error) throw error
    return NextResponse.json({ draws: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch draws' }, { status: 500 })
  }
}

// POST /api/draws — simulate or publish
export async function POST(req) {
  try {
    const adminSupabase = getAdminSupabase()
    const { mode = 'weighted', totalRevenue = 0, publish = false } = await req.json()

    const { data: allScores } = await adminSupabase.from('scores').select('score')
    const winningNumbers = mode === 'weighted'
      ? weightedDraw(allScores || [])
      : generateRandomDraw()

    const prizes = calculatePrizePool(Number(totalRevenue))

    // Simulation only
    if (!publish) {
      return NextResponse.json({ simulation: true, winningNumbers, prizes })
    }

    // Publish draw
    const { data: draw, error: drawErr } = await adminSupabase
      .from('draws')
      .insert({
        winning_numbers: winningNumbers,
        total_revenue: Number(totalRevenue),
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (drawErr) throw drawErr

    // Match winners and handle jackpot rollover
    const { tier5Winners, tier4Winners, tier3Winners } =
      await matchAndCreateWinners(draw, winningNumbers, prizes)

    // ✅ JACKPOT ROLLOVER: if no 5-match winner, flag draw as rolled over
    if (tier5Winners.length === 0) {
      await adminSupabase
        .from('draws')
        .update({ jackpot_rollover: true })
        .eq('id', draw.id)

      console.log(`[DRAW ${draw.id}] No 5-match winner — jackpot rolls over to next month.`)
    }

    // Send draw result emails to all active subscribers
    await sendDrawResultEmails(winningNumbers, prizes, tier5Winners.length === 0)

    return NextResponse.json({
      success: true,
      draw,
      winningNumbers,
      prizes,
      jackpotRolledOver: tier5Winners.length === 0,
      winners: {
        tier5: tier5Winners.length,
        tier4: tier4Winners.length,
        tier3: tier3Winners.length,
      }
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/draws]', err)
    return NextResponse.json({ error: err.message || 'Draw failed' }, { status: 500 })
  }
}

async function matchAndCreateWinners(draw, winningNumbers, prizes) {
  const adminSupabase = getAdminSupabase()
  const { data: users } = await adminSupabase
    .from('users')
    .select('id, email, scores(score)')
    .eq('subscription_status', 'active')

  if (!users) return { tier5Winners: [], tier4Winners: [], tier3Winners: [] }

  const tier5Winners = [], tier4Winners = [], tier3Winners = []

  for (const user of users) {
    const userScores = (user.scores || []).map(s => Number(s.score))
    const matchCount = userScores.filter(s => winningNumbers.includes(s)).length
    if (matchCount >= 5) tier5Winners.push(user)
    else if (matchCount === 4) tier4Winners.push(user)
    else if (matchCount === 3) tier3Winners.push(user)
  }

  const insertWinners = async (userList, tier, totalPrize) => {
    if (!userList.length) return
    const perPerson = parseFloat((totalPrize / userList.length).toFixed(2))
    const rows = userList.map(u => ({
      user_id: u.id,
      draw_id: draw.id,
      tier,
      payment_status: 'pending',
      prize_amount: perPerson,
    }))
    await adminSupabase.from('winners').insert(rows)

    // Send winner emails
    for (const user of userList) {
      await sendWinnerEmail(user.email, tier, perPerson)
    }
  }

  await Promise.all([
    insertWinners(tier5Winners, 'tier5', prizes.tier5),
    insertWinners(tier4Winners, 'tier4', prizes.tier4),
    insertWinners(tier3Winners, 'tier3', prizes.tier3),
  ])

  return { tier5Winners, tier4Winners, tier3Winners }
}

async function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_your_api_key_here' || !apiKey.startsWith('re_')) return null
  const { Resend } = await import('resend')
  return new Resend(apiKey)
}

async function sendWinnerEmail(email, tier, amount) {
  const resend = await getResend()
  if (!resend) return

  const tierLabel = {
    tier5: '5-Number Jackpot',
    tier4: '4-Number Match',
    tier3: '3-Number Match'
  }[tier]

  try {
    await resend.emails.send({
      from: 'GolfImpact <noreply@golfimpact.com>',
      to: email,
      subject: `🏆 You Won! — £${amount} ${tierLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0B0E14;color:#F8FAFC;padding:40px;border-radius:24px;">
          <h1 style="color:#3B82F6;">Congratulations!</h1>
          <p style="font-size:18px;">You matched ${tierLabel.split('-')[0]} numbers in our charity draw!</p>
          <div style="background:#1E293B;padding:20px;border-radius:16px;margin:24px 0;text-align:center;">
            <p style="margin:0;color:#94A3B8;text-transform:uppercase;font-size:12px;letter-spacing:1px;">Your Prize</p>
            <h2 style="margin:8px 0;font-size:32px;color:#22C55E;">£${amount}</h2>
          </div>
          <p style="color:#94A3B8;line-height:1.6;">Our team will process your payment within 48 hours. Keep playing to support your chosen charity!</p>
        </div>
      `
    })
  } catch (err) {
    console.error(`[Email] Winner notification failed:`, err.message)
  }
}

async function sendDrawResultEmails(winningNumbers, prizes, jackpotRolled) {
  const resend = await getResend()
  if (!resend) return

  const adminSupabase = getAdminSupabase()
  const { data: users } = await adminSupabase
    .from('users')
    .select('email')
    .eq('subscription_status', 'active')

  if (!users?.length) return

  try {
    await resend.emails.send({
      from: 'GolfImpact <noreply@golfimpact.com>',
      to: users.map(u => u.email),
      subject: 'GolfImpact Monthly Draw Results is OUT! 🏌️',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0B0E14;color:#F8FAFC;padding:40px;border-radius:24px;">
          <h1 style="color:#3B82F6;">Monthly Draw Results</h1>
          <div style="display:flex;gap:12px;justify-content:center;margin:32px 0;">
            ${winningNumbers.map(n => `
              <div style="width:48px;height:48px;background:#3B82F6;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;">
                ${n}
              </div>
            `).join('')}
          </div>
          <p style="color:#94A3B8;text-align:center;">
            ${jackpotRolled ? "No jackpot winner this month — the prize pool rolls over!" : "We have a jackpot winner!"}
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="display:block;background:#3B82F6;color:white;padding:16px;text-align:center;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:24px;">
            Check My Results
          </a>
        </div>
      `
    })
  } catch (err) {
    console.error('[Email] Draw results failed:', err.message)
  }
}