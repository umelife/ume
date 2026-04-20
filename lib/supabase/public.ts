/**
 * Public Supabase client — anon key only, no session/cookies.
 *
 * Use this for READ-ONLY queries on publicly accessible tables
 * (listings, users for seller info, etc.) where you want to
 * cache results with `unstable_cache`.
 *
 * The regular `createClient()` from supabase/server reads cookies,
 * which makes it incompatible with Next.js `unstable_cache`. This
 * client is safe to use inside cached functions.
 *
 * RLS note: the anon key respects all Row Level Security policies.
 * Ensure the `listings` and `users` tables allow anon SELECT.
 */

import { createClient } from '@supabase/supabase-js'

// Singleton — instantiated once per Node.js process (warm Vercel function).
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false },
  }
)

export default supabasePublic
