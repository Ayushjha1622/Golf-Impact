import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[Webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err.message)
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    console.log(`[Webhook] Event received: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        const email = session.customer_details?.email
        const stripeCustomerId = session.customer

        console.log('[Webhook] Activating subscription for:', email, 'userId:', userId)

        // Prefer userId from metadata, fall back to email match
        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'active',
              stripe_customer_id: stripeCustomerId,
            })
            .eq('id', userId)
        } else if (email) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'active',
              stripe_customer_id: stripeCustomerId,
            })
            .eq('email', email)
        }
        break
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const stripeCustomerId = subscription.customer
        const status = subscription.status

        // Map Stripe status to our status
        let appStatus = 'inactive'
        if (status === 'active' || status === 'trialing') appStatus = 'active'
        else if (status === 'past_due') appStatus = 'renewal_pending'

        console.log('[Webhook] Subscription update:', stripeCustomerId, '->', appStatus)

        await supabase
          .from('users')
          .update({ subscription_status: appStatus })
          .eq('stripe_customer_id', stripeCustomerId)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Webhook] Unexpected error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  
  }
}