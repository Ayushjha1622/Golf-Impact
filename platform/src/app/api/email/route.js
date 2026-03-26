import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/email/welcome — send welcome email
export async function POST(req) {
  try {
    const { email, type } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const templates = {
      welcome: {
        subject: 'Welcome to GolfImpact 🏌️',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0B0E14;color:#F8FAFC;padding:40px;border-radius:24px;">
            <h1 style="color:#3B82F6;margin-bottom:8px;">Welcome to GolfImpact!</h1>
            <p style="color:#94A3B8;font-size:16px;line-height:1.6;">
              Your account is ready. Now it's time to choose your charity, subscribe to a plan, and start entering scores.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe"
               style="display:inline-block;background:#3B82F6;color:white;padding:14px 28px;border-radius:50px;font-weight:bold;text-decoration:none;margin-top:24px;">
              Activate My Subscription
            </a>
            <p style="color:#475569;font-size:12px;margin-top:32px;">GolfImpact · digitalheroes.co.in</p>
          </div>
        `,
      },
      subscription_active: {
        subject: 'Subscription Activated — You\'re in! ✅',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0B0E14;color:#F8FAFC;padding:40px;border-radius:24px;">
            <h1 style="color:#22C55E;">You're subscribed!</h1>
            <p style="color:#94A3B8;font-size:16px;line-height:1.6;">
              Your subscription is now active. You can enter your scores and you'll be automatically entered into next month's charity draw.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
               style="display:inline-block;background:#3B82F6;color:white;padding:14px 28px;border-radius:50px;font-weight:bold;text-decoration:none;margin-top:24px;">
              Go to Dashboard
            </a>
          </div>
        `,
      },
    }

    const template = templates[type] || templates.welcome

    const { error } = await resend.emails.send({
      from: 'GolfImpact <noreply@golfimpact.com>',
      to: email,
      subject: template.subject,
      html: template.html,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/email]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
