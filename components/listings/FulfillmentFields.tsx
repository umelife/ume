'use client'

/**
 * FulfillmentFields
 *
 * Client component for the fulfillment section of the create/edit listing form.
 * Shows/hides shipping-specific fields (ZIP, weight, dimensions) based on the
 * seller's fulfillment type selection.
 *
 * All inputs use standard HTML name attributes so the parent <form> server action
 * receives them directly.
 */

import { useState } from 'react'

type FulfillmentType = 'in_person' | 'shipping' | 'both'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
]

export default function FulfillmentFields({
  defaultFulfillmentType = 'in_person',
  defaultShipsFromStreet = '',
  defaultShipsFromZip = '',
  defaultShipsFromCity = '',
  defaultShipsFromState = '',
  defaultWeightOz = '',
  defaultPkgLength = '',
  defaultPkgWidth = '',
  defaultPkgHeight = '',
}: {
  defaultFulfillmentType?: FulfillmentType
  defaultShipsFromStreet?: string
  defaultShipsFromZip?: string
  defaultShipsFromCity?: string
  defaultShipsFromState?: string
  defaultWeightOz?: string | number
  defaultPkgLength?: string | number
  defaultPkgWidth?: string | number
  defaultPkgHeight?: string | number
}) {
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(defaultFulfillmentType)

  const showShipping = fulfillmentType === 'shipping' || fulfillmentType === 'both'

  return (
    <div className="space-y-4">

      {/* Fulfillment type */}
      <div role="group" aria-labelledby="fulfillment-label">
        <label id="fulfillment-label" className="block text-sm text-black mb-2">
          How will you sell this? <span className="text-gray-500">(required)</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-3">

          {/* In Person */}
          <label className={`flex-1 border-2 rounded-2xl px-4 py-3 cursor-pointer transition-colors ${
            fulfillmentType === 'in_person' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-white hover:border-gray-500'
          }`}>
            <input
              type="radio"
              name="fulfillment_type"
              value="in_person"
              checked={fulfillmentType === 'in_person'}
              onChange={() => setFulfillmentType('in_person')}
              className="sr-only"
            />
            <div className="font-semibold text-sm text-black mb-0.5">Meet in Person</div>
            <div className="text-xs text-gray-500">Exchange via Safe-Handshake at a campus Safe-Point</div>
          </label>

          {/* Ship It */}
          <label className={`flex-1 border-2 rounded-2xl px-4 py-3 cursor-pointer transition-colors ${
            fulfillmentType === 'shipping' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-white hover:border-gray-500'
          }`}>
            <input
              type="radio"
              name="fulfillment_type"
              value="shipping"
              checked={fulfillmentType === 'shipping'}
              onChange={() => setFulfillmentType('shipping')}
              className="sr-only"
            />
            <div className="font-semibold text-sm text-black mb-0.5">Ship It</div>
            <div className="text-xs text-gray-500">Ship directly to the buyer (requires Stripe setup)</div>
          </label>

          {/* Both */}
          <label className={`flex-1 border-2 rounded-2xl px-4 py-3 cursor-pointer transition-colors ${
            fulfillmentType === 'both' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-white hover:border-gray-500'
          }`}>
            <input
              type="radio"
              name="fulfillment_type"
              value="both"
              checked={fulfillmentType === 'both'}
              onChange={() => setFulfillmentType('both')}
              className="sr-only"
            />
            <div className="font-semibold text-sm text-black mb-0.5">Both</div>
            <div className="text-xs text-gray-500">Buyer can choose in-person or shipping</div>
          </label>

        </div>
      </div>

      {/* Accept Stripe payments (for in_person) */}
      {(fulfillmentType === 'in_person' || fulfillmentType === 'both') && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="accepts_stripe"
            value="true"
            className="mt-0.5 w-4 h-4 border-2 border-gray-900 rounded cursor-pointer"
          />
          <span className="text-sm text-black">
            Accept Stripe card payment for in-person meetups{' '}
            <span className="text-gray-500">(recommended — buyer pays online, you exchange at Safe-Point)</span>
          </span>
        </label>
      )}

      {/* Shipping fields — shown when shipping is selected */}
      {showShipping && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold text-black">Shipping details</p>
          <p className="text-xs text-gray-500 -mt-2">
            Required for shipping rate calculation. Stripe setup required to offer shipping.
          </p>

          {/* Ships from address */}
          <div>
            <label className="block text-xs text-black mb-1">
              Ships from address <span className="text-gray-500">(required for shipping label generation)</span>
            </label>
            <input
              name="ships_from_street"
              type="text"
              defaultValue={defaultShipsFromStreet}
              placeholder="Street address"
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400 mb-2"
            />
            <div className="flex gap-2">
              <input
                id="ships_from_city"
                name="ships_from_city"
                type="text"
                defaultValue={defaultShipsFromCity}
                placeholder="City"
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              />
              <select
                name="ships_from_state"
                defaultValue={defaultShipsFromState}
                className="w-20 border border-gray-300 rounded-full px-2 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">ST</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                id="ships_from_zip"
                name="ships_from_zip"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                defaultValue={defaultShipsFromZip}
                placeholder="ZIP"
                className="w-24 border border-gray-300 rounded-full px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weight_oz" className="block text-xs text-black mb-1">
              Package weight (oz) <span className="text-gray-500">(required for shipping rates)</span>
            </label>
            <input
              id="weight_oz"
              name="weight_oz"
              type="number"
              min="1"
              max="70400"
              step="1"
              defaultValue={defaultWeightOz || ''}
              placeholder="e.g. 16"
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Dimensions — optional */}
          <div>
            <label className="block text-xs text-black mb-1">
              Package dimensions — inches <span className="text-gray-500">(optional, improves rate accuracy)</span>
            </label>
            <div className="flex gap-2">
              <input
                name="pkg_length"
                type="number"
                min="0.1"
                step="0.1"
                defaultValue={defaultPkgLength || ''}
                placeholder="Length"
                aria-label="Length in inches"
                className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              />
              <input
                name="pkg_width"
                type="number"
                min="0.1"
                step="0.1"
                defaultValue={defaultPkgWidth || ''}
                placeholder="Width"
                aria-label="Width in inches"
                className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              />
              <input
                name="pkg_height"
                type="number"
                min="0.1"
                step="0.1"
                defaultValue={defaultPkgHeight || ''}
                placeholder="Height"
                aria-label="Height in inches"
                className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
