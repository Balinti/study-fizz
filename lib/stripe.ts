import Stripe from 'stripe'

// Create stripe client lazily to avoid build-time errors
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}

// For backwards compatibility
export const stripe = {
  get customers() {
    return getStripe().customers
  },
  get subscriptions() {
    return getStripe().subscriptions
  },
  get checkout() {
    return getStripe().checkout
  },
  get billingPortal() {
    return getStripe().billingPortal
  },
  get webhooks() {
    return getStripe().webhooks
  },
}

export function getStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getProPriceIds() {
  return {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_STUDY_MONTHLY_PRICE_ID || null,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRO_STUDY_ANNUAL_PRICE_ID || null,
  }
}

export function hasProPriceIds() {
  const prices = getProPriceIds()
  return Boolean(prices.monthly || prices.annual)
}
