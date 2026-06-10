import { ImageResponse } from 'next/og'
import supabasePublic from '@/lib/supabase/public'

export const runtime = 'nodejs'

const SITE = 'https://ume-life.com'

function formatPrice(cents: number | null | undefined): string {
  if (!cents) return 'Free'
  const d = cents / 100
  return d % 1 === 0 ? `$${d}` : `$${d.toFixed(2)}`
}

/**
 * Branded, story-sized (1080×1920) share card for a listing. The ShareButton
 * fetches this and shares it as an image file so it works for Instagram
 * Stories/feed (which don't accept bare links) and looks good in DMs. The QR
 * encodes the listing URL with the sharer's referral code.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ref = new URL(req.url).searchParams.get('ref')

  const { data: listing } = await supabasePublic
    .from('listings')
    .select('title, price, image_urls')
    .eq('id', id)
    .single()

  const title = (listing?.title ?? 'Check this out on UME').slice(0, 60)
  const price = formatPrice(listing?.price)
  const photo = listing?.image_urls?.[0] ?? null

  const listingUrl = `${SITE}/item/${id}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(listingUrl)}`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #130170 0%, #1d01a8 55%, #0a0040 100%)',
          padding: 72,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ color: 'white' }}>U</span>
          <span style={{ color: '#fa9ebc' }}>ME</span>
        </div>

        {/* Photo */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 40 }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              width={840}
              height={840}
              style={{ width: 840, height: 840, objectFit: 'cover', borderRadius: 48 }}
            />
          ) : (
            <div style={{ display: 'flex', width: 840, height: 840, borderRadius: 48, background: 'rgba(255,255,255,0.08)' }} />
          )}
        </div>

        {/* Price + title */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 44 }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 800 }}>{price}</div>
          <div style={{ display: 'flex', fontSize: 44, opacity: 0.92, marginTop: 8 }}>{title}</div>
        </div>

        {/* QR + CTA */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} width={200} height={200} style={{ width: 200, height: 200, borderRadius: 20, background: 'white', padding: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 32 }}>
            <div style={{ display: 'flex', fontSize: 44, fontWeight: 700 }}>Scan to grab it</div>
            <div style={{ display: 'flex', fontSize: 38, color: '#fa9ebc', marginTop: 6 }}>verified students only · ume-life.com</div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  )
}
