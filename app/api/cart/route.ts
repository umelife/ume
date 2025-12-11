import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'

export interface CartRow {
  id: string
  listing_id: string
  title: string
  price: number
  qty: number
  seller_id: string
  seller_name: string
  seller_campus: string
  image_url: string | null
}

/**
 * GET /api/cart
 * Returns cart items for logged-in user
 * Falls back gracefully if no cart or no user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    // If no user, return empty cart (client will use localStorage)
    if (!user) {
      return NextResponse.json({ items: [] })
    }

    const supabase = await createClient()

    // Fetch cart items with listing and seller data
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        listing_id,
        quantity,
        listing:listings (
          id,
          title,
          price,
          image_urls,
          user_id,
          user:users (
            id,
            display_name,
            university_domain
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cart items:', error)
      return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 })
    }

    // Transform to CartRow format
    const items: CartRow[] = (cartItems || []).map((item: any) => ({
      id: item.id,
      listing_id: item.listing?.id || '',
      title: item.listing?.title || 'Unknown Item',
      price: item.listing?.price || 0,
      qty: item.quantity || 1,
      seller_id: item.listing?.user?.id || '',
      seller_name: item.listing?.user?.display_name || 'Unknown Seller',
      seller_campus: item.listing?.user?.university_domain || 'Unknown Campus',
      image_url: item.listing?.image_urls?.[0] || null
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Cart API error:', error)
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 })
  }
}

/**
 * DELETE /api/cart
 * Removes item from cart
 * Accepts JSON body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting cart item:', error)
      return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete cart item error:', error)
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
  }
}
