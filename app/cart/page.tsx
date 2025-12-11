'use client'

/**
 * Cart Page - Payment-Free MVP
 *
 * Features:
 * - Loads cart from API (/api/cart) for logged-in users
 * - Falls back to localStorage (reclaim_cart) for guests
 * - No checkout/payment buttons
 * - Contact Seller buttons for each item
 * - Supports Remove item
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CartItem, { type CartItemData } from '@/components/cart/CartItem'
import { formatPrice } from '@/lib/utils/helpers'

const LOCALSTORAGE_KEY = 'reclaim_cart'

export default function CartPage() {
  const [supabase] = useState(() => createClient())
  const [cartItems, setCartItems] = useState<CartItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentUserCampus, setCurrentUserCampus] = useState<string>('')
  const router = useRouter()

  // Load cart items
  useEffect(() => {
    let mounted = true

    async function loadCart() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (mounted) {
          setCurrentUser(user)
        }

        // If logged in, try API first
        if (user) {
          // Get user's campus
          const { data: userData } = await supabase
            .from('users')
            .select('university_domain')
            .eq('id', user.id)
            .single()

          if (mounted && userData) {
            setCurrentUserCampus(userData.university_domain || '')
          }

          // Fetch from API
          const response = await fetch('/api/cart')
          const data = await response.json()

          if (!mounted) return

          if (data.error) {
            // Fallback to localStorage if API fails
            console.warn('API cart failed, using localStorage:', data.error)
            loadFromLocalStorage()
          } else {
            setCartItems(data.items || [])
          }
        } else {
          // Guest user - use localStorage
          if (mounted) {
            loadFromLocalStorage()
          }
        }
      } catch (err) {
        console.error('Cart load error:', err)
        if (mounted) {
          // Fallback to localStorage on any error
          loadFromLocalStorage()
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    function loadFromLocalStorage() {
      try {
        const stored = localStorage.getItem(LOCALSTORAGE_KEY)
        if (stored) {
          const items = JSON.parse(stored)
          setCartItems(items)
        } else {
          setCartItems([])
        }
      } catch (err) {
        console.error('localStorage parse error:', err)
        setCartItems([])
      }
    }

    loadCart()

    return () => {
      mounted = false
    }
  }, [supabase])

  // Handle remove item
  const handleRemove = async (itemId: string) => {
    try {
      // Optimistically update UI
      setCartItems(prev => prev.filter(item => item.id !== itemId))

      // If logged in, call API
      if (currentUser) {
        const response = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId })
        })

        if (!response.ok) {
          console.error('Failed to remove from API cart')
          // Revert on error
          const { data } = await fetch('/api/cart').then(r => r.json())
          setCartItems(data.items || [])
        }
      } else {
        // Update localStorage for guests
        const updated = cartItems.filter(item => item.id !== itemId)
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Remove error:', err)
      alert('Failed to remove item. Please try again.')
    }
  }

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.qty), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Cart</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-24 h-24 mx-auto mb-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Add listings to your cart and contact sellers to arrange payment and pickup.
            </p>
            <Link
              href="/marketplace"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                currentUserCampus={currentUserCampus}
              />
            ))}
          </div>

          {/* Summary - No Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Cart Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold">{cartItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quantity</span>
                  <span className="font-semibold">{cartItems.reduce((sum, item) => sum + item.qty, 0)}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Estimated Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  💬 Contact sellers directly
                </p>
                <p className="text-xs text-blue-700">
                  Use the "Contact Seller" buttons above to arrange payment and pickup/shipping with each seller.
                </p>
              </div>

              <Link
                href="/marketplace"
                className="block w-full text-center bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Continue Shopping
              </Link>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-500 text-center">
                  Payment processing is handled directly with sellers via PayPal, Venmo, or cash on pickup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
