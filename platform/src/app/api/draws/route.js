import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { weightedDraw, generateRandomDraw, calculatePrizePool } from '@/utils/drawEngine'

const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

// GET /api/draws
export async function GET() {
  try {
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

async function sendWinnerEmail(email, tier, amount) {
  if (!process.env.RESEND_API_KEY) return
  const tierLabel = { tier5: '5-Number Jackpot', tier4: '4-Number Match', tier3: '3-Number Match' }[tier]
  try {
    await resend.emails.send({
      from: 'GolfImpact <noreply@golfimpact.com>',
      to: email,
      subject: `🏆 You Won! — £${amount} ${tierLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0B0E14;color:#F8FAFC;padding:40px;border-radius:24px;">
          <h1 style="color:#3B82F6;margin-bottom:8px;">Congratulations!</h1>
          <p style="color:#94A3B8;font-size:18px;">You matched a <strong style="color:#F8FAFC;">${tierLabel}</strong> in this month's GolfImpact draw.</p>
          <div style="background:#1E293B;border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
            <p style="margin:0;color:#94A3B8;font-size:14px;">Your prize</p>
            <h2 style="margin:8px 0 0;font-size:48px;color:#3B82F6;">£${amount}</h2>
          </div>
          <p style="color:#94A3B8;">Log in to your dashboard and upload your score proof to claim your prize.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upload-proof" 
             style="display:inline-block;background:#3B82F6;color:white;padding:14px 28px;border-radius:50px;font-weight:bold;text-decoration:none;margin-top:16px;">
            Claim My Prize
          </a>
        </div>
      `,
    })
  } catch (err) {
    console.error(`[Email] Failed to send winner email to ${email}:`, err.message)
  }
}

async function sendDrawResultEmails(winningNumbers, prizes, jackpotRolled) {
  if (!process.env.RESEND_API_KEY) return
  const { data: users } = await adminSupabase
    .from('users')
    .select('email')
    .eq('subscription_status', 'active')

  if (!users?.length) return

  const numbersDisplay = winningNumbers.join(' · ')
  const subject = jackpotRolled
    ? `This month's draw results — Jackpot rolls over!`
    : `This month's draw results are in!`

  // Send in batch (Resend allows batch via array)
  try {
    await resend.emails.send({
      from: 'GolfImpact <noreply@golfimpact.com>',
      to: users.map(u => u.email),
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0B0E14;color:#F8FAFC;padding:40px;border-radius:24px;">
          <h1 style="color:#3B82F6;">Monthly Draw Results</h1>
          <p style="color:#94A3B8;">This month's winning numbers were:</p>
          <div style="display:flex;gap:12px;margin:20px 0;flex-wrap:wrap;">
            ${winningNumbers.map(n => `<span style="background:#1E3A5F;color:#60A5FA;padding:12px 18px;border-radius:12px;font-size:24px;font-weight:bold;">${n}</span>`).join('')}
          </div>
          ${jackpotRolled ? '<p style="color:#F59E0B;font-weight:bold;">No 5-match winner — the jackpot rolls over to next month!</p>' : ''}
          <p style="color:#94A3B8;">Log in to your dashboard to see if you won.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display:inline-block;background:#3B82F6;color:white;padding:14px 28px;border-radius:50px;font-weight:bold;text-decoration:none;margin-top:16px;">
            View My Dashboard
          </a>
        </div>
      `,
    })
  } catch (err) {
    console.error('[Email] Failed to send draw result emails:', err.message)
  }
}
