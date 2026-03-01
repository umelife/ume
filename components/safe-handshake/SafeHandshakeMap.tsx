'use client'

// NOTE: This component must ONLY be imported via dynamic() with ssr: false
// because Leaflet requires the browser's window object.
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SAFE_POINTS, GEOFENCE_RADIUS_METERS } from '@/data/safe-points'

// Fix Leaflet's broken default marker icons in webpack/Next.js environments
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  userLat: number | null
  userLon: number | null
  activeSafePointId: string | null  // which safe point is "glowing" (user is inside)
  partnerSafePointId?: string | null // partner's safe point (for display)
}

export default function SafeHandshakeMap({
  userLat,
  userLon,
  activeSafePointId,
  partnerSafePointId,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userMarkerRef = useRef<L.CircleMarker | null>(null)
  const circlesRef = useRef<Record<string, L.Circle>>({})

  // Initialize the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    }).setView([36.7435, -84.1570], 17)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(map)

    // Draw safe-point circles
    SAFE_POINTS.forEach((point) => {
      const circle = L.circle([point.lat, point.lng], {
        radius: GEOFENCE_RADIUS_METERS,
        color: '#22c55e',
        weight: 2,
        fillColor: '#22c55e',
        fillOpacity: 0.15,
      }).addTo(map)

      // Label
      L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            background: white;
            border: 2px solid #130170;
            border-radius: 8px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 600;
            color: #130170;
            white-space: nowrap;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          ">${point.name}</div>`,
          iconAnchor: [0, 0],
        }),
      }).addTo(map)

      circlesRef.current[point.id] = circle
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update safe-point circle styles when active point changes
  useEffect(() => {
    SAFE_POINTS.forEach((point) => {
      const circle = circlesRef.current[point.id]
      if (!circle) return

      const isUserHere = point.id === activeSafePointId
      const isPartnerHere = point.id === partnerSafePointId

      if (isUserHere && isPartnerHere) {
        // Both here — bright glow
        circle.setStyle({ color: '#16a34a', weight: 4, fillOpacity: 0.4 })
      } else if (isUserHere || isPartnerHere) {
        // One of them here
        circle.setStyle({ color: '#22c55e', weight: 3, fillOpacity: 0.3 })
      } else {
        // Nobody here
        circle.setStyle({ color: '#22c55e', weight: 2, fillOpacity: 0.15 })
      }
    })
  }, [activeSafePointId, partnerSafePointId])

  // Update "You are here" dot
  useEffect(() => {
    if (!mapRef.current || userLat === null || userLon === null) return

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLat, userLon])
    } else {
      userMarkerRef.current = L.circleMarker([userLat, userLon], {
        radius: 8,
        color: '#1d4ed8',
        weight: 3,
        fillColor: '#3b82f6',
        fillOpacity: 0.9,
      })
        .bindTooltip('You', { permanent: false, direction: 'top' })
        .addTo(mapRef.current)
    }
  }, [userLat, userLon])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-gray-200"
      style={{ height: 260 }}
    />
  )
}
