/**
 * Stripe Client Singleton
 *
 * Creates and exports a single Stripe client instance for use across the app.
 * Uses the secret key from environment variables.
 *
 * IMPORTANT: Only import this in server-side code (API routes, server actions).
 * Never import on the client side — it would expose your secret key.
 */

import Stripe from 'stripe'

// Validate that the secret key is configured
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is not set. Add it to your .env.local file.\n' +
    'Get your key from: https://dashboard.stripe.com/apikeys'
  )
}

// Single shared Stripe client instance
// The API version is set automatically by the SDK
export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
