/**
 * Order Detail Page
 *
 * Shows full order details for either the buyer or seller.
 * For sellers: shows shipping address and a "Generate Label" button (once EasyPost is set up).
 * For buyers: shows order status, tracking info, and a refund option.
 */

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import RefundButton from '@/components/orders/RefundButton'
import GenerateLabelButton from '@/components/orders/GenerateLabelButton'
import type { Order } from '@/types/database'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user: currentUser } = await getUser()

  if (!currentUser) {
    redirect('/login')
  }

  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      listing:listings(id, title, image_urls, price),
      buyer:users!orders_buyer_id_fkey(id, display_name, email),
      seller:users!orders_seller_id_fkey(id, display_name, email)
    `)
    .eq('id', id)
    .single()

  if (error || !order) {
    notFound()
  }

  // Only buyer or seller can view this order
  const isBuyer = currentUser.id === order.buyer_id
  const isSeller = currentUser.id === order.seller_id

  if (!isBuyer && !isSeller) {
    notFound()
  }

  const buyer = order.buyer as any
  const seller = order.seller as any
  const listing = order.listing as any
  const shippingAddress = order.buyer_shipping_address as any

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    refunded: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  const canRefund = (isBuyer || isSeller) && ['paid', 'processing', 'completed'].includes(order.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/marketplace" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Marketplace
          </Link>
          <h1 className="text-2xl font-bold text-black mt-2">Order Details</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="space-y-4">

          {/* Status card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total</p>
                <p className="text-2xl font-bold text-black">${((order.amount_cents ?? 0) / 100).toFixed(2)}</p>
                {(order.shipping_cost_cents ?? 0) > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    incl. ${((order.shipping_cost_cents!) / 100).toFixed(2)} shipping
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Payment</p>
                <p className="font-medium capitalize">{order.payment_method || 'Stripe'}</p>
              </div>
              <div>
                <p className="text-gray-500">Fulfillment</p>
                <p className="font-medium capitalize">{(order.fulfillment_type || 'in_person').replace('_', ' ')}</p>
              </div>
              {order.created_at && (
                <div>
                  <p className="text-gray-500">Ordered</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              )}
              {order.completed_at && (
                <div>
                  <p className="text-gray-500">Completed</p>
                  <p className="font-medium">{new Date(order.completed_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Listing */}
          {listing && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Item</p>
              <div className="flex gap-4">
                {listing.image_urls?.[0] && (
                  <img
                    src={listing.image_urls[0]}
                    alt={listing.title}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-black">{listing.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    ${((listing.price ?? 0) / 100).toFixed(2)}
                  </p>
                  <Link
                    href={`/item/${listing.id}`}
                    className="text-xs text-blue-600 hover:underline mt-1 block"
                  >
                    View listing →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Shipping address — shown to seller for shipping orders */}
          {isSeller && order.fulfillment_type === 'shipping' && shippingAddress && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Ship to</p>
              <address className="not-italic text-sm text-black leading-relaxed">
                <p className="font-semibold">{shippingAddress.name}</p>
                <p>{shippingAddress.street1}</p>
                {shippingAddress.street2 && <p>{shippingAddress.street2}</p>}
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
              </address>

              {/* Shipping label */}
              {order.shipping_label_url ? (
                <a
                  href={order.shipping_label_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Shipping Label
                </a>
              ) : order.status === 'paid' && order.easypost_shipment_id ? (
                <div className="mt-4">
                  <GenerateLabelButton orderId={order.id} />
                </div>
              ) : (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  No shipping label yet. Generate one below once the order is paid.
                </div>
              )}
            </div>
          )}

          {/* Tracking info — visible to both buyer and seller */}
          {order.fulfillment_type === 'shipping' && (order as any).tracking_number && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Tracking</p>
              <p className="text-sm font-mono text-black">{(order as any).tracking_number}</p>
              {(order as any).carrier && (
                <p className="text-sm text-gray-500 mt-1">{(order as any).carrier}</p>
              )}
              {(order as any).tracking_url && (
                <a
                  href={(order as any).tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
                >
                  Track package →
                </a>
              )}
              {order.status === 'completed' && (
                <p className="mt-3 text-sm text-green-700 font-semibold">✓ Delivered</p>
              )}
            </div>
          )}

          {/* Buyer protection — no tracking after 3 days */}
          {isBuyer && order.fulfillment_type === 'shipping' && order.status === 'paid' && !(order as any).tracking_number && (() => {
            const paidDate = new Date((order as any).completed_at || order.created_at)
            const daysSincePaid = (Date.now() - paidDate.getTime()) / (1000 * 60 * 60 * 24)
            return daysSincePaid >= 3
          })() && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <p className="font-semibold text-red-800 mb-1">Seller hasn&apos;t shipped yet</p>
              <p className="text-sm text-red-700 mb-4">
                It&apos;s been more than 3 days since payment and no tracking info has been added.
                You can request a refund.
              </p>
              <RefundButton order={order as unknown as Order} currentUserId={currentUser.id} />
            </div>
          )}

          {/* Buyer / Seller info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {isSeller && buyer && (
              <>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Buyer</p>
                <p className="font-semibold text-black">{buyer.display_name}</p>
                <p className="text-sm text-gray-500">{buyer.email}</p>
              </>
            )}
            {isBuyer && seller && (
              <>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Seller</p>
                <p className="font-semibold text-black">{seller.display_name}</p>
                <Link
                  href={`/messages?listing=${order.listing_id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Message seller →
                </Link>
              </>
            )}
          </div>

          {/* Refund button — buyer or seller, Stripe orders */}
          {canRefund && (
            <RefundButton order={order as unknown as Order} currentUserId={currentUser.id} />
          )}

        </div>
      </div>
    </div>
  )
}
