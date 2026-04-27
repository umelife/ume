export interface User {
  id: string;
  email: string;
  display_name: string;
  username?: string;
  university_domain: string;
  college_name?: string;
  college_address?: string;
  avatar_url?: string;
  created_at: string;
  // seller_rating?: number; // Feature disabled
  total_sales?: number;
  verified_seller?: boolean;
  stripe_account_id?: string;
  stripe_onboarding_completed?: boolean;
}

export type ListingCondition = 'New' | 'Like New' | 'Used' | 'Refurbished';

export type FulfillmentType = 'in_person' | 'shipping' | 'both';

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  image_urls: string[];
  created_at: string;
  condition?: ListingCondition;
  features?: string[];
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  latitude?: number;
  longitude?: number;
  distance_miles?: number;
  // Fulfillment + shipping fields
  fulfillment_type?: FulfillmentType;
  accepts_stripe?: boolean;
  ships_from_zip?: string;
  weight_oz?: number;
  pkg_length?: number;
  pkg_width?: number;
  pkg_height?: number;
  user?: User;
}

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
  listing?: Listing;
}

export interface Report {
  id: string;
  reporter_id: string;
  listing_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: User;
  listing?: Listing;
}

export type ListingCategory =
  | 'Dorm and Decor'
  | 'Fun and Craft'
  | 'Transportation'
  | 'Tech and Gadgets'
  | 'Books'
  | 'Clothing and Accessories'
  | 'Giveaways'
  | 'Other';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'refunded' | 'cancelled';

export type SafeHandshakeStatus =
  | 'initiated'
  | 'in_progress'
  | 'seller_arrived'
  | 'buyer_arrived'
  | 'both_arrived'
  | 'qr_generated'
  | 'completed'
  | 'cancelled'

export interface SafeHandshake {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string
  status: SafeHandshakeStatus
  safe_point_id?: string
  custom_location_text?: string
  custom_lat?: number
  custom_lng?: number
  seller_arrived_at?: string
  buyer_arrived_at?: string
  qr_token?: string
  qr_token_expires_at?: string
  qr_token_used: boolean
  completed_at?: string
  expires_at: string
  created_at: string
  updated_at: string
  seller?: User
  buyer?: User
  listing?: Listing
}

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_refund_id?: string;
  amount_cents: number;
  currency: string;
  platform_fee_cents: number;
  seller_amount_cents: number;
  status: OrderStatus;
  payment_method?: string;
  buyer_email?: string;
  buyer_name?: string;
  completed_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
  // Fulfillment + shipping fields
  fulfillment_type?: FulfillmentType;
  easypost_shipment_id?: string;
  easypost_rate_id?: string;
  shipping_label_url?: string;
  shipping_cost_cents?: number;
  buyer_shipping_address?: ShippingAddress;
  buyer?: User;
  seller?: User;
  listing?: Listing;
}
