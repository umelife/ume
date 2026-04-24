import { SAFE_POINTS, GEOFENCE_RADIUS_METERS, type SafePoint } from '@/data/safe-points'

/**
 * Calculate the distance between two GPS coordinates in metres
 * using the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000 // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Returns the nearest Safe-Point within the geofence radius, or null.
 * Accepts an optional `points` list — pass campus-filtered safe points
 * so only relevant locations are checked.
 */
export function getNearestSafePoint(
  userLat: number,
  userLon: number,
  points: SafePoint[] = SAFE_POINTS
): { point: SafePoint; distanceMeters: number } | null {
  let nearest: { point: SafePoint; distanceMeters: number } | null = null

  for (const point of points) {
    const dist = haversineDistance(userLat, userLon, point.lat, point.lng)
    if (dist <= GEOFENCE_RADIUS_METERS) {
      if (!nearest || dist < nearest.distanceMeters) {
        nearest = { point, distanceMeters: dist }
      }
    }
  }

  return nearest
}

/**
 * Returns distance in metres from the user to a specific safe point.
 */
export function distanceToSafePoint(
  userLat: number,
  userLon: number,
  pointId: string,
  points: SafePoint[] = SAFE_POINTS
): number | null {
  const point = points.find((p) => p.id === pointId)
  if (!point) return null
  return haversineDistance(userLat, userLon, point.lat, point.lng)
}
