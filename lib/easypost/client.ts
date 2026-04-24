/**
 * EasyPost Client Singleton
 *
 * Creates and exports a single EasyPost client instance.
 * Only import this in server-side code (API routes, server actions).
 */

import EasyPostClient from '@easypost/api'

if (!process.env.EASYPOST_API_KEY) {
  throw new Error(
    'EASYPOST_API_KEY is not set. Add it to your .env.local file.\n' +
    'Get your key from: https://www.easypost.com/account/api-keys'
  )
}

export const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY)
