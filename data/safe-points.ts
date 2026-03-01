export interface SafePoint {
  id: string
  name: string
  lat: number
  lng: number
  description: string
}

export const SAFE_POINTS: SafePoint[] = [
  {
    id: 'student_union',
    name: 'Student Union',
    lat: 36.7431,
    lng: -84.1568,
    description: 'Main entrance, Blue Light station',
  },
  {
    id: 'hagan_library',
    name: 'Hagan Library',
    lat: 36.7424,
    lng: -84.1555,
    description: 'Front steps, Blue Light station',
  },
  {
    id: 'boswell_center',
    name: 'Boswell Center',
    lat: 36.7438,
    lng: -84.1575,
    description: 'Main entrance, Blue Light station',
  },
  {
    id: 'public_safety',
    name: 'Public Safety Office',
    lat: 36.7445,
    lng: -84.1582,
    description: 'Campus Police, staffed 24/7',
  },
]

export const GEOFENCE_RADIUS_METERS = 25
