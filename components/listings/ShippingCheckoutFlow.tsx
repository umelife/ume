'use client'

/**
 * ShippingCheckoutFlow
 *
 * Multi-step component for buyers who want an item shipped:
 *
 * Step 1 — Address: buyer enters their shipping address
 * Step 2 — Rates: fetches real EasyPost rates (USPS, UPS, FedEx), buyer selects one
 * Step 3 — Checkout: redirects to Stripe hosted checkout with selected shipping cost
 */

import { useState, useRef, useEffect, useCallback } from 'react'

interface ShippingAddress {
  name: string
  street1: string
  street2: string
  city: string
  state: string
  zip: string
}

interface Rate {
  id: string
  shipmentId: string
  carrier: string
  service: string
  rateCents: number
  deliveryDays: number | null
}

type Step = 'address' | 'rates' | 'checkout'

interface Props {
  listing: {
    id: string
    title: string
    price: number
  }
  onClose: () => void
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
]

const CARRIER_LOGOS: Record<string, string> = {
  USPS: '🇺🇸',
  UPS: '🟤',
  FedEx: '🟣',
  DHL: '🟡',
}

interface NominatimResult {
  display_name: string
  address: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    country_code?: string
  }
}

// Abbreviate a US state name to its 2-letter code
const STATE_ABBR: Record<string, string> = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
  'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA',
  'Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
  'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM',
  'New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
  'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
  'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
  'District of Columbia':'DC',
}

export default function ShippingCheckoutFlow({ listing, onClose }: Props) {
  const [step, setStep] = useState<Step>('address')
  const [address, setAddress] = useState<ShippingAddress>({
    name: '', street1: '', street2: '', city: '', state: '', zip: '',
  })
  const [rates, setRates] = useState<Rate[]>([])
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Address autocomplete state
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 5) { setSuggestions([]); return }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&countrycodes=us&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data: NominatimResult[] = await res.json()
      setSuggestions(data.filter(r => r.address.postcode && r.address.country_code === 'us'))
      setShowSuggestions(true)
    } catch { /* ignore */ }
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    setAddressConfirmed(false)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchSuggestions(val), 400)
  }

  const handleSelectSuggestion = (result: NominatimResult) => {
    const a = result.address
    const streetNum = a.house_number || ''
    const street = a.road || ''
    const city = a.city || a.town || a.village || ''
    const stateRaw = a.state || ''
    const state = STATE_ABBR[stateRaw] || stateRaw.slice(0, 2).toUpperCase()
    const zip = (a.postcode || '').slice(0, 5)
    const street1 = [streetNum, street].filter(Boolean).join(' ')
    setAddress(prev => ({ ...prev, street1, city, state, zip }))
    setSearchQuery(street1 ? `${street1}, ${city}, ${state} ${zip}` : result.display_name)
    setSuggestions([])
    setShowSuggestions(false)
    setAddressConfirmed(true)
  }

  const inputClass =
    'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-ume-indigo placeholder-gray-400'

  // Step 1 → Step 2: fetch rates
  const handleFetchRates = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          toName: address.name,
          toStreet1: address.street1,
          toStreet2: address.street2 || undefined,
          toCity: address.city,
          toState: address.state,
          toZip: address.zip,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to fetch rates')

      setRates(data.rates)
      setSelectedRate(data.rates[0] || null)
      setStep('rates')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → Stripe checkout
  const handleCheckout = async () => {
    if (!selectedRate) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          fulfillmentType: 'shipping',
          shippingAddress: address,
          shippingCostCents: selectedRate.rateCents,
          easypostRateId: selectedRate.id,
          easypostShipmentId: selectedRate.shipmentId,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create checkout')

      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {step === 'rates' && (
            <button onClick={() => setStep('address')} className="text-gray-400 hover:text-gray-600">
              ←
            </button>
          )}
          <h3 className="font-bold text-black">
            {step === 'address' ? 'Shipping address' : 'Choose shipping'}
          </h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          Cancel
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1 mb-4">
        {(['address', 'rates'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              step === s || (step === 'checkout' && i === 1)
                ? 'bg-ume-pink'
                : step === 'rates' && i === 0
                ? 'bg-ume-pink'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Address ── */}
      {step === 'address' && (
        <form onSubmit={handleFetchRates} className="space-y-3">
          {/* Name */}
          <input
            type="text"
            placeholder="Full name"
            required
            autoComplete="name"
            value={address.name}
            onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
            className={inputClass}
          />

          {/* Address search with autocomplete */}
          {!manualEntry ? (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your address…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                  className={inputClass}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg text-sm overflow-hidden">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        onMouseDown={() => handleSelectSuggestion(s)}
                        className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-black border-b border-gray-100 last:border-0 leading-snug"
                      >
                        {s.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setManualEntry(true); setAddressConfirmed(true) }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Can't find your address? Enter manually
              </button>

              {/* Filled-in address preview + apt field — shown after selection */}
              {addressConfirmed && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm space-y-2">
                  <p className="text-indigo-800 font-medium">
                    {address.street1}, {address.city}, {address.state} {address.zip}
                  </p>
                  <input
                    type="text"
                    placeholder="Apt, suite, unit (optional)"
                    autoComplete="address-line2"
                    value={address.street2}
                    onChange={e => setAddress(a => ({ ...a, street2: e.target.value }))}
                    className="w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-ume-indigo placeholder-gray-400"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Street address"
                required
                autoComplete="address-line1"
                value={address.street1}
                onChange={e => setAddress(a => ({ ...a, street1: e.target.value }))}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Apt, suite, etc. (optional)"
                autoComplete="address-line2"
                value={address.street2}
                onChange={e => setAddress(a => ({ ...a, street2: e.target.value }))}
                className={inputClass}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="City"
                  required
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                  className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-ume-indigo placeholder-gray-400"
                />
                <select
                  required
                  autoComplete="address-level1"
                  value={address.state}
                  onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                  className="w-20 border border-gray-300 rounded-xl px-2 py-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-ume-indigo"
                >
                  <option value="">ST</option>
                  {US_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="ZIP"
                  required
                  autoComplete="postal-code"
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  value={address.zip}
                  onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))}
                  className="w-24 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-ume-indigo placeholder-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={() => setManualEntry(false)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                ← Search address instead
              </button>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || (!addressConfirmed && !manualEntry) || !address.name || !address.street1 || !address.city || !address.state || !address.zip}
            className="w-full bg-ume-indigo hover:bg-indigo-800 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Getting rates...
              </>
            ) : (
              'See Shipping Rates →'
            )}
          </button>
        </form>
      )}

      {/* ── Step 2: Rate selection ── */}
      {step === 'rates' && (
        <div className="space-y-3">
          {rates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No rates available for this address.</p>
          ) : (
            <div className="space-y-2">
              {rates.map(rate => (
                <label
                  key={rate.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedRate?.id === rate.id
                      ? 'border-ume-indigo bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="rate"
                    checked={selectedRate?.id === rate.id}
                    onChange={() => setSelectedRate(rate)}
                    className="sr-only"
                  />
                  <span className="text-xl">{CARRIER_LOGOS[rate.carrier] || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-black">
                      {rate.carrier} {rate.service}
                    </p>
                    {rate.deliveryDays !== null && (
                      <p className="text-xs text-gray-500">
                        {rate.deliveryDays} {rate.deliveryDays === 1 ? 'day' : 'days'}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-ume-indigo text-sm">
                    ${(rate.rateCents / 100).toFixed(2)}
                  </p>
                </label>
              ))}
            </div>
          )}

          {/* Order summary */}
          {selectedRate && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Item</span>
                <span>${(listing.price / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping ({selectedRate.carrier} {selectedRate.service})</span>
                <span>${(selectedRate.rateCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-black border-t border-gray-100 pt-1">
                <span>Total</span>
                <span>${((listing.price + selectedRate.rateCents) / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={loading || !selectedRate}
            className="w-full bg-ume-pink hover:bg-pink-400 disabled:bg-pink-300 text-white font-semibold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to checkout...
              </>
            ) : (
              'Continue to Payment →'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
