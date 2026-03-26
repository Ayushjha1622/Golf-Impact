import Stripe from 'stripe'
import { createClient } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    // Initialise Stripe inside handler so module-level errors don't return HTML
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized — please log in first' }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { priceId } = body

    if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      return NextResponse.json(
        { error: `Invalid price ID: "${priceId}". Check NEXT_PUBLIC_STRIPE_*_PRICE_ID in .env.local` },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: `${appUrl}/dashboard?status=success`,
      cancel_url: `${appUrl}/subscribe?status=cancelled`,
      metadata: { userId: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[POST /api/subscribe]', err)
    return NextResponse.json(
      { error: err?.message || 'Error creating checkout session' },
      { status: 500 }
    )
  }
}
