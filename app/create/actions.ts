// app/create/actions.ts
'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server' // server scoped client factory
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCampusFromEmail } from '@/data/safe-points'

// Check if environment variables are set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing environment variables:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SERVICE_ROLE_KEY: !!SERVICE_ROLE_KEY
  })
}

const supabaseAdmin = createAdminClient(
  SUPABASE_URL!,
  SERVICE_ROLE_KEY!
)

/**
 * Server action to handle create listing form submission.
 * Use in page form: <form action={handleCreateListing}>...</form>
 */
export async function handleCreateListing(formData: FormData): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized - Please log in first')
    }

    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const category = (formData.get('category') as string) || 'Other'
    const condition = (formData.get('condition') as string) || 'Used'
    const priceRaw = (formData.get('price') as string) || '0'
    const priceNumber = Number(priceRaw)
    const price_cents = Math.round(priceNumber * 100)
    const imageUrlsRaw = (formData.get('imageUrls') as string) || '[]'

    // Fulfillment + shipping fields
    const fulfillment_type = (formData.get('fulfillment_type') as string) || 'in_person'
    const accepts_stripe = formData.get('accepts_stripe') === 'true'
    const ships_from_street = (formData.get('ships_from_street') as string) || null
    const ships_from_zip = (formData.get('ships_from_zip') as string) || null
    const ships_from_city = (formData.get('ships_from_city') as string) || null
    const ships_from_state = (formData.get('ships_from_state') as string) || null
    const weight_oz_raw = formData.get('weight_oz') as string
    const weight_oz = weight_oz_raw ? parseInt(weight_oz_raw, 10) : null
    const pkg_length_raw = formData.get('pkg_length') as string
    const pkg_length = pkg_length_raw ? parseFloat(pkg_length_raw) : null
    const pkg_width_raw = formData.get('pkg_width') as string
    const pkg_width = pkg_width_raw ? parseFloat(pkg_width_raw) : null
    const pkg_height_raw = formData.get('pkg_height') as string
    const pkg_height = pkg_height_raw ? parseFloat(pkg_height_raw) : null

    let imageUrls: string[] = []
    try {
      imageUrls = imageUrlsRaw ? JSON.parse(imageUrlsRaw) : []
    } catch (e) {
      console.error('[CreateListing] Failed to parse imageUrls:', e)
      imageUrls = []
    }

    // Derive campus from verified email (standardised — never user-typed)
    const campus = getCampusFromEmail(user.email)
    const seller_campus_id = campus?.id ?? null
    // Use the campus geographic centre for radius filtering.
    // Sellers don't need to enter coordinates — their .edu domain determines it.
    const latitude = campus?.lat ?? null
    const longitude = campus?.lng ?? null

    // Verify user profile exists (should be created during signup)
    const { data: userProfile, error: profileCheckErr } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('id', user.id)
      .single()

    if (profileCheckErr || !userProfile) {
      throw new Error('User profile not found. Please sign out and sign back in.')
    }

    // Insert listing (price stored in cents in `price` column)
    const { error: insertErr, data: insertedListing } = await supabaseAdmin
      .from('listings')
      .insert([
        {
          user_id: user.id,
          title,
          description,
          category,
          condition,
          price: price_cents,
          image_urls: imageUrls,
          created_at: new Date().toISOString(),
          seller_campus_id,
          latitude,
          longitude,
          fulfillment_type,
          accepts_stripe: fulfillment_type !== 'shipping' ? accepts_stripe : true,
          ships_from_street,
          ships_from_zip,
          ships_from_city,
          ships_from_state,
          weight_oz,
          pkg_length,
          pkg_width,
          pkg_height,
        },
      ])
      .select()

    if (insertErr) {
      throw new Error(`Create listing failed: ${insertErr.message}`)
    }

    revalidatePath('/marketplace')
    redirect('/marketplace')

  } catch (error: any) {
    console.error('[CreateListing] Unexpected error:', error)
    // If it's already a redirect, just throw it
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error
    }
    // Otherwise, throw a user-friendly error
    throw new Error(`Failed to create listing: ${error.message}`)
  }
}
