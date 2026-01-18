import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

function getSubscriptionEndDate(subscription: Stripe.Subscription): string {
  // Handle different Stripe API versions
  const endDate = (subscription as unknown as { current_period_end: number }).current_period_end
  return new Date(endDate * 1000).toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    let event: Stripe.Event

    // Verify signature if webhook secret is configured
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        )
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ received: true }, { status: 200 })
      }
    } else {
      // Parse without verification (development mode)
      event = JSON.parse(body) as Stripe.Event
    }

    const supabase = await createServiceClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.supabase_user_id
          if (!userId) {
            console.error('No user ID in checkout session metadata')
            break
          }

          const subscriptionResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const subscription = subscriptionResponse as Stripe.Subscription

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0]?.price.id,
            current_period_end: getSubscriptionEndDate(subscription),
            updated_at: new Date().toISOString(),
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find user by subscription ID
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              price_id: subscription.items.data[0]?.price.id,
              current_period_end: getSubscriptionEndDate(subscription),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', existingSub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
